import { format, compareAsc, isPast } from 'date-fns';

// Todos array (Feature 1)
let todos = [];
let nextId = 1;

// Current filter (Feature 2)
let currentFilter = 'all';

// Sort by due date (Feature 3)
let sortByDueDate = false;

// Storage helper functions
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        todos = JSON.parse(stored);
        // Restore nextId to be one more than the max id
        if (todos.length > 0) {
            nextId = Math.max(...todos.map(t => t.id)) + 1;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // Wire up add button
    const addBtn = document.getElementById('addBtn');
    const todoInput = document.getElementById('todoInput');

    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Wire up filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Wire up sort by due date button
    const sortBtn = document.getElementById('sortByDueDateBtn');
    sortBtn.addEventListener('click', () => toggleSortByDueDate());

    // Load todos from localStorage
    loadTodos();
    renderTodos();
}

// Feature 1: Add, toggle, delete todos
function addTodo() {
    const input = document.getElementById('todoInput');
    const dateInput = document.getElementById('dueDateInput');
    const text = input.value.trim();

    if (text === '') return;

    todos.push({
        id: nextId++,
        text: text,
        completed: false,
        dueDate: dateInput.value || null
    });

    saveTodos();
    input.value = '';
    dateInput.value = '';
    renderTodos();
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
}

// Feature 3: Helper functions for due dates
function formatDueDate(isoDateString) {
    if (!isoDateString) return null;
    return format(new Date(isoDateString), 'MMM d');
}

function isOverdue(isoDateString) {
    if (!isoDateString) return false;
    return isPast(new Date(isoDateString)) && !isToday(new Date(isoDateString));
}

function isToday(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
}

function sortTodosByDueDate(todoArray) {
    const todosWithDate = [];
    const todosWithoutDate = [];

    todoArray.forEach(todo => {
        if (todo.dueDate) {
            todosWithDate.push(todo);
        } else {
            todosWithoutDate.push(todo);
        }
    });

    todosWithDate.sort((a, b) => compareAsc(new Date(a.dueDate), new Date(b.dueDate)));

    return [...todosWithDate, ...todosWithoutDate];
}

function toggleSortByDueDate() {
    sortByDueDate = !sortByDueDate;
    const sortBtn = document.getElementById('sortByDueDateBtn');
    sortBtn.classList.toggle('active');
    sortBtn.textContent = sortByDueDate ? 'Sort by Due Date: ON' : 'Sort by Due Date: OFF';
    renderTodos();
}

// Feature 1: Render todos
function renderTodos() {
    const todoList = document.getElementById('todoList');
    const filteredTodos = getFilteredTodos();

    todoList.innerHTML = '';

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        if (todo.completed) li.classList.add('completed');

        const dueDateHtml = todo.dueDate
            ? `<span class="todo-due-date">• Due: ${formatDueDate(todo.dueDate)}</span>`
            : '';

        const overdueHtml = todo.dueDate && isOverdue(todo.dueDate)
            ? '<span class="overdue-badge">OVERDUE ⏰</span>'
            : '';

        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            ${dueDateHtml}
            ${overdueHtml}
            <button class="todo-delete">Delete</button>
        `;

        li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
        li.querySelector('.todo-delete').addEventListener('click', () => deleteTodo(todo.id));

        todoList.appendChild(li);
    });
}

// Feature 2: Filter todos based on current filter
function getFilteredTodos() {
    let filtered;
    if (currentFilter === 'active') {
        filtered = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = todos.filter(t => t.completed);
    } else {
        filtered = todos; // 'all'
    }

    // Apply sorting if enabled
    if (sortByDueDate) {
        filtered = sortTodosByDueDate(filtered);
    }

    return filtered;
}

// Feature 2: Set filter and update UI
function setFilter(filter) {
    currentFilter = filter;

    // Update button styling
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    renderTodos();
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
