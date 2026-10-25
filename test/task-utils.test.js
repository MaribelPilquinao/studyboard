const test = require("node:test");
const assert = require("node:assert/strict");

const {
  filterTasks,
  getDaysRemaining,
  getUrgency,
  isValidDateValue,
  isValidTask,
  parseImportedTasks,
  serializeTasks,
} = require("../task-utils.js");

const today = new Date(2026, 9, 24);

function makeTask(overrides = {}) {
  return {
    id: "task-1",
    title: "Leer capítulo",
    course: "Historia",
    dueDate: "2026-10-28",
    priority: "media",
    notes: "",
    completed: false,
    ...overrides,
  };
}

test("valida fechas reales y rechaza fechas imposibles", () => {
  assert.equal(isValidDateValue("2026-10-24"), true);
  assert.equal(isValidDateValue("2026-02-29"), false);
  assert.equal(isValidDateValue("2026-13-01"), false);
});

test("valida la estructura de una tarea", () => {
  assert.equal(isValidTask(makeTask()), true);
  assert.equal(isValidTask(makeTask({ priority: "urgente" })), false);
  assert.equal(isValidTask(makeTask({ dueDate: "2026-02-31" })), false);
  assert.equal(isValidTask(makeTask({ notes: "x".repeat(501) })), false);
  assert.equal(isValidTask({ ...makeTask(), notes: undefined }), true);
});

test("calcula días restantes sin depender de la hora actual", () => {
  assert.equal(getDaysRemaining("2026-10-24", today), 0);
  assert.equal(getDaysRemaining("2026-10-27", today), 3);
  assert.equal(getDaysRemaining("2026-10-23", today), -1);
});

test("clasifica la urgencia de una tarea", () => {
  assert.deepEqual(getUrgency("2026-10-24", today), {
    label: "Vence hoy",
    className: "is-today",
  });
  assert.deepEqual(getUrgency("2026-10-26", today), {
    label: "Próxima · 2 días",
    className: "is-soon",
  });
  assert.deepEqual(getUrgency("2026-11-10", today), {
    label: "Con tiempo",
    className: "is-later",
  });
});

test("filtra por curso y estado, priorizando pendientes y fechas cercanas", () => {
  const tasks = [
    makeTask({ id: "completed", dueDate: "2026-10-24", completed: true }),
    makeTask({ id: "later", dueDate: "2026-11-01" }),
    makeTask({ id: "soon", dueDate: "2026-10-25" }),
    makeTask({ id: "math", course: "Matemáticas" }),
  ];

  assert.deepEqual(
    filterTasks(tasks).map((task) => task.id),
    ["soon", "math", "later", "completed"],
  );
  assert.deepEqual(
    filterTasks(tasks, "Historia", "pendientes").map((task) => task.id),
    ["soon", "later"],
  );
});

test("busca por título o curso sin distinguir mayúsculas", () => {
  const tasks = [
    makeTask({ id: "history", title: "Leer capítulo", course: "Historia" }),
    makeTask({
      id: "math",
      title: "Resolver ejercicios",
      course: "Matemáticas",
    }),
  ];

  assert.deepEqual(
    filterTasks(tasks, "todos", "todas", "MATEMÁTICAS").map((task) => task.id),
    ["math"],
  );
  assert.deepEqual(
    filterTasks(tasks, "todos", "todas", "capítulo").map((task) => task.id),
    ["history"],
  );
});

test("ordena por fecha, prioridad y título", () => {
  const tasks = [
    makeTask({
      id: "low",
      title: "Zeta",
      dueDate: "2026-11-01",
      priority: "baja",
    }),
    makeTask({
      id: "high",
      title: "Alfa",
      dueDate: "2026-11-03",
      priority: "alta",
    }),
    makeTask({
      id: "medium",
      title: "Beta",
      dueDate: "2026-10-25",
      priority: "media",
    }),
  ];

  assert.deepEqual(
    filterTasks(tasks, "todos", "todas", "", "date-desc").map(
      (task) => task.id,
    ),
    ["high", "low", "medium"],
  );
  assert.deepEqual(
    filterTasks(tasks, "todos", "todas", "", "priority").map((task) => task.id),
    ["high", "medium", "low"],
  );
  assert.deepEqual(
    filterTasks(tasks, "todos", "todas", "", "title").map((task) => task.id),
    ["high", "medium", "low"],
  );
});

test("exporta e importa una lista de tareas", () => {
  const tasks = [makeTask({ id: "exported" })];
  const exported = serializeTasks(tasks);
  const parsed = JSON.parse(exported);

  assert.equal(parsed.app, "StudyBoard");
  assert.equal(parsed.version, 1);
  assert.deepEqual(parseImportedTasks(exported), tasks);
  assert.deepEqual(parseImportedTasks(JSON.stringify(tasks)), tasks);
});

test("normaliza tareas antiguas sin notas", () => {
  const legacyTask = makeTask();
  delete legacyTask.notes;

  assert.deepEqual(parseImportedTasks(JSON.stringify([legacyTask])), [
    { ...makeTask(), notes: "" },
  ]);
});

test("conserva notas multilinea en importación y exportación", () => {
  const tasks = [
    makeTask({ id: "noted", notes: "Leer páginas 1-3\nLlevar resumen" }),
  ];

  assert.deepEqual(parseImportedTasks(serializeTasks(tasks)), tasks);
});

test("rechaza importaciones con estructura o tareas inválidas", () => {
  assert.throws(() => parseImportedTasks("{}"), /lista de tareas/);
  assert.throws(
    () => parseImportedTasks(JSON.stringify([{ id: "invalid" }])),
    /datos inválidos/,
  );
  assert.throws(
    () =>
      parseImportedTasks(
        JSON.stringify([
          makeTask({ id: "duplicate" }),
          makeTask({ id: "duplicate" }),
        ]),
      ),
    /IDs de tareas duplicados/,
  );
});
