(function (root, factory) {
  const utils = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = utils;
  }
  if (root) {
    root.StudyBoardUtils = utils;
  }
})(typeof globalThis === "object" ? globalThis : this, function () {
  const MAX_NOTES_LENGTH = 500;

  function isValidDateValue(dateValue) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return false;
    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  function isValidTask(task) {
    return (
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.course === "string" &&
      isValidDateValue(task.dueDate) &&
      ["alta", "media", "baja"].includes(task.priority) &&
      typeof task.completed === "boolean" &&
      (typeof task.notes === "undefined" ||
        (typeof task.notes === "string" &&
          task.notes.length <= MAX_NOTES_LENGTH))
    );
  }

  function normalizeTask(task) {
    if (!isValidTask(task)) return null;
    return {
      ...task,
      notes: typeof task.notes === "string" ? task.notes : "",
    };
  }

  function getDateAtMidnight(dateValue) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function getDaysRemaining(dueDate, today = new Date()) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const currentDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    return Math.round(
      (getDateAtMidnight(dueDate) - currentDay) / millisecondsPerDay,
    );
  }

  function getUrgency(dueDate, today) {
    const daysRemaining = getDaysRemaining(dueDate, today);

    if (daysRemaining < 0) return { label: "Vencida", className: "is-overdue" };
    if (daysRemaining === 0)
      return { label: "Vence hoy", className: "is-today" };
    if (daysRemaining <= 3) {
      return {
        label: `Próxima · ${daysRemaining} día${daysRemaining === 1 ? "" : "s"}`,
        className: "is-soon",
      };
    }
    return { label: "Con tiempo", className: "is-later" };
  }

  function filterTasks(
    tasks,
    courseFilter = "todos",
    statusFilter = "todas",
    searchQuery = "",
    sortBy = "date-asc",
  ) {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("es");
    const priorityOrder = { alta: 0, media: 1, baja: 2 };

    return tasks
      .filter(
        (task) => courseFilter === "todos" || task.course === courseFilter,
      )
      .filter((task) => {
        if (statusFilter === "pendientes") return !task.completed;
        if (statusFilter === "completadas") return task.completed;
        return true;
      })
      .filter((task) => {
        if (!normalizedQuery) return true;
        return `${task.title} ${task.course}`
          .toLocaleLowerCase("es")
          .includes(normalizedQuery);
      })
      .sort((firstTask, secondTask) => {
        if (sortBy === "title") {
          return firstTask.title.localeCompare(secondTask.title, "es");
        }
        if (sortBy === "priority") {
          return (
            priorityOrder[firstTask.priority] -
              priorityOrder[secondTask.priority] ||
            firstTask.dueDate.localeCompare(secondTask.dueDate)
          );
        }
        if (sortBy === "date-desc") {
          return secondTask.dueDate.localeCompare(firstTask.dueDate);
        }
        if (firstTask.completed !== secondTask.completed) {
          return Number(firstTask.completed) - Number(secondTask.completed);
        }
        return firstTask.dueDate.localeCompare(secondTask.dueDate);
      });
  }

  function serializeTasks(tasks) {
    return JSON.stringify(
      {
        app: "StudyBoard",
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks,
      },
      null,
      2,
    );
  }

  function parseImportedTasks(contents) {
    const parsed = JSON.parse(contents);
    const importedTasks = Array.isArray(parsed)
      ? parsed
      : parsed && parsed.tasks;
    if (!Array.isArray(importedTasks)) {
      throw new Error("El archivo no contiene una lista de tareas.");
    }

    const validTasks = importedTasks.map(normalizeTask);
    if (validTasks.some((task) => task === null)) {
      throw new Error("El archivo contiene tareas con datos inválidos.");
    }
    if (new Set(validTasks.map((task) => task.id)).size !== validTasks.length) {
      throw new Error("El archivo contiene IDs de tareas duplicados.");
    }
    return validTasks;
  }

  return {
    filterTasks,
    getDateAtMidnight,
    getDaysRemaining,
    getUrgency,
    isValidDateValue,
    isValidTask,
    normalizeTask,
    parseImportedTasks,
    serializeTasks,
  };
});
