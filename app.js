const STORAGE_KEY = "studyboard-tasks";

const state = {
  tasks: [],
  courseFilter: "todos",
  statusFilter: "todas"
};

const elements = {
  form: document.querySelector("#task-form"),
  titleInput: document.querySelector("#task-title"),
  courseInput: document.querySelector("#task-course"),
  dueDateInput: document.querySelector("#task-due-date"),
  priorityInput: document.querySelector("#task-priority"),
  titleError: document.querySelector("#title-error"),
  dateError: document.querySelector("#date-error"),
  courseFilter: document.querySelector("#course-filter"),
  statusButtons: document.querySelectorAll("[data-status]"),
  taskList: document.querySelector("#task-list"),
  taskTemplate: document.querySelector("#task-template"),
  emptyState: document.querySelector("#empty-state"),
  taskCount: document.querySelector("#task-count"),
  progressCount: document.querySelector("#progress-count"),
  progressBar: document.querySelector("#progress-bar")
};

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
    return Array.isArray(parsedTasks) ? parsedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function createTask(title, course, dueDate, priority) {
  return {
    id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title: title.trim(),
    course: course.trim() || "Sin curso",
    dueDate,
    priority,
    completed: false
  };
}

function getDateAtMidnight(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getDaysRemaining(dueDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((getDateAtMidnight(dueDate) - getToday()) / millisecondsPerDay);
}

function getUrgency(dueDate) {
  const daysRemaining = getDaysRemaining(dueDate);

  if (daysRemaining < 0) {
    return { label: "Vencida", className: "is-overdue" };
  }
  if (daysRemaining === 0) {
    return { label: "Vence hoy", className: "is-today" };
  }
  if (daysRemaining <= 3) {
    return { label: `Próxima · ${daysRemaining} día${daysRemaining === 1 ? "" : "s"}`, className: "is-soon" };
  }
  return { label: "Con tiempo", className: "is-later" };
}

function formatDate(dateValue) {
  return getDateAtMidnight(dateValue).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getFilteredTasks() {
  return state.tasks
    .filter((task) => state.courseFilter === "todos" || task.course === state.courseFilter)
    .filter((task) => {
      if (state.statusFilter === "pendientes") return !task.completed;
      if (state.statusFilter === "completadas") return task.completed;
      return true;
    })
    .sort((firstTask, secondTask) => {
      if (firstTask.completed !== secondTask.completed) return Number(firstTask.completed) - Number(secondTask.completed);
      return firstTask.dueDate.localeCompare(secondTask.dueDate);
    });
}

function validateTaskForm() {
  const title = elements.titleInput.value.trim();
  const dueDate = elements.dueDateInput.value;
  let isValid = true;

  elements.titleError.textContent = "";
  elements.dateError.textContent = "";

  if (!title) {
    elements.titleError.textContent = "Escribe un título.";
    isValid = false;
  }
  if (!dueDate) {
    elements.dateError.textContent = "Selecciona una fecha.";
    isValid = false;
  }

  return isValid;
}

function updateCourseFilter() {
  const courses = [...new Set(state.tasks.map((task) => task.course))].sort((firstCourse, secondCourse) =>
    firstCourse.localeCompare(secondCourse, "es")
  );
  const previousValue = state.courseFilter;

  elements.courseFilter.replaceChildren(new Option("Todos los cursos", "todos"));
  courses.forEach((course) => elements.courseFilter.add(new Option(course, course)));

  state.courseFilter = courses.includes(previousValue) ? previousValue : "todos";
  elements.courseFilter.value = state.courseFilter;
}

function updateProgress() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.completed).length;
  const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

  elements.progressCount.textContent = `${completedTasks} de ${totalTasks}`;
  elements.progressBar.style.width = `${progress}%`;
}

function renderTask(task) {
  const taskElement = elements.taskTemplate.content.cloneNode(true);
  const card = taskElement.querySelector(".task-card");
  const urgency = getUrgency(task.dueDate);
  const completeButton = taskElement.querySelector(".button-complete");
  const deleteButton = taskElement.querySelector(".button-delete");

  card.dataset.taskId = task.id;
  card.classList.toggle("is-completed", task.completed);
  taskElement.querySelector(".task-title").textContent = task.title;
  taskElement.querySelector(".task-course").textContent = task.course;
  taskElement.querySelector(".task-date").textContent = `Entrega: ${formatDate(task.dueDate)}`;
  taskElement.querySelector(".priority-badge").textContent = `Prioridad ${task.priority}`;

  const urgencyBadge = taskElement.querySelector(".urgency-badge");
  urgencyBadge.textContent = urgency.label;
  urgencyBadge.classList.add(urgency.className);

  completeButton.textContent = task.completed ? "Reabrir" : "Completar";
  completeButton.setAttribute("aria-label", `${task.completed ? "Reabrir" : "Completar"} ${task.title}`);
  deleteButton.setAttribute("aria-label", `Eliminar ${task.title}`);
  completeButton.addEventListener("click", () => toggleTask(task.id));
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  return taskElement;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();
  elements.taskList.replaceChildren(...filteredTasks.map(renderTask));
  elements.emptyState.hidden = filteredTasks.length > 0;
  elements.taskCount.textContent = `${filteredTasks.length} tarea${filteredTasks.length === 1 ? "" : "s"}`;
  updateProgress();
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveTasks();
  updateCourseFilter();
  renderTasks();
}

function handleFormSubmit(event) {
  event.preventDefault();
  if (!validateTaskForm()) return;

  state.tasks.push(createTask(
    elements.titleInput.value,
    elements.courseInput.value,
    elements.dueDateInput.value,
    elements.priorityInput.value
  ));
  saveTasks();
  updateCourseFilter();
  renderTasks();
  elements.form.reset();
  elements.priorityInput.value = "media";
  elements.titleInput.focus();
}

function initializeEvents() {
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.courseFilter.addEventListener("change", (event) => {
    state.courseFilter = event.target.value;
    renderTasks();
  });
  elements.statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.statusFilter = button.dataset.status;
      elements.statusButtons.forEach((filterButton) => {
        filterButton.classList.toggle("is-active", filterButton === button);
      });
      renderTasks();
    });
  });
}

function initializeApp() {
  state.tasks = loadTasks();
  initializeEvents();
  updateCourseFilter();
  renderTasks();
}

initializeApp();
