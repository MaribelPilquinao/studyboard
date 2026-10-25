const STORAGE_KEY = "studyboard-tasks";
const MAX_IMPORT_SIZE = 1024 * 1024;
const {
  filterTasks,
  getDateAtMidnight,
  getUrgency,
  isValidDateValue,
  isValidTask,
  normalizeTask,
  parseImportedTasks,
  serializeTasks,
} = window.StudyBoardUtils;

const state = {
  tasks: [],
  courseFilter: "todos",
  statusFilter: "todas",
  searchQuery: "",
  sortBy: "date-asc",
  editingTaskId: null,
};

const elements = {
  form: document.querySelector("#task-form"),
  titleInput: document.querySelector("#task-title"),
  courseInput: document.querySelector("#task-course"),
  dueDateInput: document.querySelector("#task-due-date"),
  priorityInput: document.querySelector("#task-priority"),
  notesInput: document.querySelector("#task-notes"),
  notesCount: document.querySelector("#notes-count"),
  notesHelp: document.querySelector("#notes-help"),
  titleError: document.querySelector("#title-error"),
  dateError: document.querySelector("#date-error"),
  formTitle: document.querySelector("#new-task-title"),
  submitButton: document.querySelector("#submit-button"),
  cancelButton: document.querySelector("#cancel-button"),
  taskSearch: document.querySelector("#task-search"),
  courseFilter: document.querySelector("#course-filter"),
  sortFilter: document.querySelector("#sort-filter"),
  clearFiltersButton: document.querySelector("#clear-filters-button"),
  exportButton: document.querySelector("#export-button"),
  importButton: document.querySelector("#import-button"),
  importInput: document.querySelector("#import-input"),
  statusButtons: document.querySelectorAll("[data-status]"),
  taskList: document.querySelector("#task-list"),
  taskTemplate: document.querySelector("#task-template"),
  emptyState: document.querySelector("#empty-state"),
  taskCount: document.querySelector("#task-count"),
  resultsSummary: document.querySelector("#results-summary"),
  progressCount: document.querySelector("#progress-count"),
  progressBar: document.querySelector("#progress-bar"),
  statusMessage: document.querySelector("#status-message"),
};

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];
    return Array.isArray(parsedTasks)
      ? parsedTasks.filter(isValidTask).map(normalizeTask)
      : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    return true;
  } catch {
    announce(
      "No se pudieron guardar los cambios. Revisa el almacenamiento del navegador.",
    );
    return false;
  }
}

function exportTasks() {
  const blob = new Blob([serializeTasks(state.tasks)], {
    type: "application/json",
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `studyboard-tareas-${new Date().toISOString().slice(0, 10)}.json`;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
    link.remove();
  }, 0);
  announce("Tareas exportadas.");
}

async function importTasks(file) {
  if (!file) return;

  try {
    if (file.size > MAX_IMPORT_SIZE) {
      throw new Error("El archivo supera el límite de 1 MB.");
    }
    const contents = await file.text();
    const importedTasks = parseImportedTasks(contents);
    if (
      !window.confirm(
        `¿Reemplazar tus ${state.tasks.length} tareas por ${importedTasks.length} tareas importadas?`,
      )
    ) {
      return;
    }

    const previousTasks = state.tasks;
    state.tasks = importedTasks;
    if (!saveTasks()) {
      state.tasks = previousTasks;
      return;
    }
    state.courseFilter = "todos";
    updateCourseFilter();
    renderTasks();
    resetForm();
    announce(
      `${importedTasks.length} tarea${importedTasks.length === 1 ? "" : "s"} importada${importedTasks.length === 1 ? "" : "s"}.`,
    );
  } catch (error) {
    announce(
      error.message ||
        "No se pudo importar el archivo. Usa un JSON de StudyBoard válido.",
    );
  } finally {
    elements.importInput.value = "";
  }
}

function announce(message) {
  elements.statusMessage.textContent = message;
}

function updateNotesCount() {
  const count = elements.notesInput.value.length;
  elements.notesCount.textContent = `${count} de 500 caracteres${
    count === 500 ? " (límite alcanzado)" : ""
  }`;
  elements.notesHelp.classList.toggle("is-limit", count === 500);
}

function updateStatusButton(button) {
  const isActive = button.dataset.status === state.statusFilter;
  button.classList.toggle("is-active", isActive);
  button.setAttribute("aria-pressed", String(isActive));
}

function createTask(title, course, dueDate, priority, notes) {
  return {
    id:
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    title: title.trim(),
    course: course.trim() || "Sin curso",
    dueDate,
    priority,
    notes: notes.trim(),
    completed: false,
  };
}

function formatDate(dateValue) {
  return getDateAtMidnight(dateValue).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function validateTaskForm() {
  const title = elements.titleInput.value.trim();
  const dueDate = elements.dueDateInput.value;
  let isValid = true;

  elements.titleError.textContent = "";
  elements.dateError.textContent = "";
  elements.titleInput.setAttribute("aria-invalid", "false");
  elements.dueDateInput.setAttribute("aria-invalid", "false");

  if (!title) {
    elements.titleError.textContent = "Escribe un título.";
    elements.titleInput.setAttribute("aria-invalid", "true");
    isValid = false;
  }
  if (!dueDate) {
    elements.dateError.textContent = "Selecciona una fecha.";
    elements.dueDateInput.setAttribute("aria-invalid", "true");
    isValid = false;
  } else if (!isValidDateValue(dueDate)) {
    elements.dateError.textContent = "Selecciona una fecha válida.";
    elements.dueDateInput.setAttribute("aria-invalid", "true");
    isValid = false;
  }

  return isValid;
}

function resetForm() {
  state.editingTaskId = null;
  elements.form.reset();
  updateNotesCount();
  elements.priorityInput.value = "media";
  elements.formTitle.textContent = "Agregar tarea";
  elements.submitButton.textContent = "Agregar tarea";
  elements.cancelButton.hidden = true;
  elements.titleError.textContent = "";
  elements.dateError.textContent = "";
  elements.titleInput.setAttribute("aria-invalid", "false");
  elements.dueDateInput.setAttribute("aria-invalid", "false");
}

function startEditing(taskId) {
  const task = state.tasks.find((currentTask) => currentTask.id === taskId);
  if (!task) return;

  state.editingTaskId = taskId;
  elements.titleInput.value = task.title;
  elements.courseInput.value = task.course === "Sin curso" ? "" : task.course;
  elements.dueDateInput.value = task.dueDate;
  elements.priorityInput.value = task.priority;
  elements.notesInput.value = task.notes;
  updateNotesCount();
  elements.formTitle.textContent = "Editar tarea";
  elements.submitButton.textContent = "Guardar cambios";
  elements.cancelButton.hidden = false;
  elements.titleInput.focus();
}

function updateCourseFilter() {
  const courses = [...new Set(state.tasks.map((task) => task.course))].sort(
    (firstCourse, secondCourse) =>
      firstCourse.localeCompare(secondCourse, "es"),
  );
  const previousValue = state.courseFilter;

  elements.courseFilter.replaceChildren(
    new Option("Todos los cursos", "todos"),
  );
  courses.forEach((course) =>
    elements.courseFilter.add(new Option(course, course)),
  );

  state.courseFilter = courses.includes(previousValue)
    ? previousValue
    : "todos";
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
  const editButton = taskElement.querySelector(".button-edit");

  card.dataset.taskId = task.id;
  card.classList.toggle("is-completed", task.completed);
  taskElement.querySelector(".task-title").textContent = task.title;
  taskElement.querySelector(".task-course").textContent = task.course;
  const notesElement = taskElement.querySelector(".task-notes");
  notesElement.textContent = task.notes;
  notesElement.hidden = !task.notes;
  taskElement.querySelector(".task-date").textContent =
    `Entrega: ${formatDate(task.dueDate)}`;
  taskElement.querySelector(".priority-badge").textContent =
    `Prioridad ${task.priority}`;

  const urgencyBadge = taskElement.querySelector(".urgency-badge");
  urgencyBadge.textContent = urgency.label;
  urgencyBadge.classList.add(urgency.className);

  const completeLabel = task.completed ? "Reabrir" : "Completar";
  completeButton.setAttribute("aria-label", `${completeLabel} ${task.title}`);
  completeButton.title = completeLabel;
  deleteButton.setAttribute("aria-label", `Eliminar ${task.title}`);
  deleteButton.title = "Eliminar";
  editButton.setAttribute("aria-label", `Editar ${task.title}`);
  editButton.title = "Editar";
  completeButton.addEventListener("click", () => toggleTask(task.id));
  editButton.addEventListener("click", () => startEditing(task.id));
  deleteButton.addEventListener("click", () => confirmDelete(task));

  return taskElement;
}

function renderTasks() {
  const filteredTasks = filterTasks(
    state.tasks,
    state.courseFilter,
    state.statusFilter,
    state.searchQuery,
    state.sortBy,
  );
  elements.taskList.replaceChildren(...filteredTasks.map(renderTask));
  elements.emptyState.hidden = filteredTasks.length > 0;
  elements.taskCount.textContent = `${filteredTasks.length} tarea${filteredTasks.length === 1 ? "" : "s"}`;
  const hasActiveFilters =
    state.searchQuery ||
    state.courseFilter !== "todos" ||
    state.statusFilter !== "todas";
  elements.resultsSummary.textContent = hasActiveFilters
    ? `Mostrando ${filteredTasks.length} de ${state.tasks.length} tareas.`
    : "";
  elements.emptyState.textContent = hasActiveFilters
    ? "No hay tareas que coincidan con los filtros actuales."
    : "Aún no tienes tareas. Agrega la primera para comenzar.";
  updateProgress();
}

function clearFilters() {
  state.searchQuery = "";
  state.courseFilter = "todos";
  state.statusFilter = "todas";
  elements.taskSearch.value = "";
  elements.courseFilter.value = "todos";
  elements.sortFilter.value = "date-asc";
  elements.statusButtons.forEach(updateStatusButton);
  renderTasks();
  announce("Filtros limpiados.");
}

function toggleTask(taskId) {
  const updatedTasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task,
  );
  const previousTasks = state.tasks;
  state.tasks = updatedTasks;
  if (!saveTasks()) {
    state.tasks = previousTasks;
    return;
  }
  renderTasks();
}

function confirmDelete(task) {
  if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
    deleteTask(task.id);
  }
}

function deleteTask(taskId) {
  const previousTasks = state.tasks;
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  if (!saveTasks()) {
    state.tasks = previousTasks;
    return;
  }
  updateCourseFilter();
  renderTasks();
  if (state.editingTaskId === taskId) resetForm();
  announce("Tarea eliminada.");
}

function handleFormSubmit(event) {
  event.preventDefault();
  if (!validateTaskForm()) return;

  const taskValues = {
    title: elements.titleInput.value,
    course: elements.courseInput.value,
    dueDate: elements.dueDateInput.value,
    priority: elements.priorityInput.value,
    notes: elements.notesInput.value,
  };
  const isEditing = state.editingTaskId !== null;
  if (isEditing) {
    state.tasks = state.tasks.map((task) =>
      task.id === state.editingTaskId
        ? {
            ...task,
            title: taskValues.title.trim(),
            course: taskValues.course.trim() || "Sin curso",
            dueDate: taskValues.dueDate,
            priority: taskValues.priority,
            notes: taskValues.notes.trim(),
          }
        : task,
    );
  } else {
    state.tasks.push(
      createTask(
        taskValues.title,
        taskValues.course,
        taskValues.dueDate,
        taskValues.priority,
        taskValues.notes,
      ),
    );
  }
  if (!saveTasks()) return;
  updateCourseFilter();
  renderTasks();
  resetForm();
  elements.titleInput.focus();
  announce(isEditing ? "Tarea actualizada." : "Tarea agregada.");
}

function initializeEvents() {
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.notesInput.addEventListener("input", updateNotesCount);
  elements.cancelButton.addEventListener("click", resetForm);
  elements.clearFiltersButton.addEventListener("click", clearFilters);
  elements.exportButton.addEventListener("click", exportTasks);
  elements.importButton.addEventListener("click", () =>
    elements.importInput.click(),
  );
  elements.importInput.addEventListener("change", (event) =>
    importTasks(event.target.files[0]),
  );
  elements.taskSearch.addEventListener("input", (event) => {
    state.searchQuery = event.target.value;
    renderTasks();
    announce(
      state.searchQuery
        ? `Búsqueda activa: ${elements.taskCount.textContent}.`
        : "Búsqueda limpiada.",
    );
  });
  elements.courseFilter.addEventListener("change", (event) => {
    state.courseFilter = event.target.value;
    renderTasks();
  });
  elements.sortFilter.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    renderTasks();
  });
  elements.statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.statusFilter = button.dataset.status;
      elements.statusButtons.forEach((filterButton) => {
        updateStatusButton(filterButton);
      });
      renderTasks();
      announce(`Filtro seleccionado: ${button.textContent}.`);
    });
  });
}

function initializeApp() {
  state.tasks = loadTasks();
  initializeEvents();
  updateCourseFilter();
  updateNotesCount();
  renderTasks();
}

initializeApp();
