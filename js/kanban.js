// js/kanban.js
// Manages the logic for the kanban board (drag-and-drop and rendering).

import { state } from './state.js';
import { updateKanbanStatusApi } from './api.js';
import { updateAllData } from './data.js';
import { showAlert } from './ui.js';

const overdueColumn = document.getElementById('overdue-column');
const inTreatmentColumn = document.getElementById('in-treatment-column');
const treatedColumn = document.getElementById('treated-column');
let dragged = null;

/**
 * Renders the kanban board with cards based on order status.
 */
export const renderKanbanBoard = () => {
    overdueColumn.innerHTML = '';
    inTreatmentColumn.innerHTML = '';
    treatedColumn.innerHTML = '';

    const overdueOrders = state.orders.filter(o => o['סטטוס'] === 'חורג');
    const inTreatmentOrders = state.orders.filter(o => o['סטטוס'] === 'בטיפול');
    const treatedOrders = state.orders.filter(o => o['סטטוס'] === 'טופל');

    overdueOrders.forEach(order => createKanbanCard(order, overdueColumn));
    inTreatmentOrders.forEach(order => createKanbanCard(order, inTreatmentColumn));
    treatedOrders.forEach(order => createKanbanCard(order, treatedColumn));

    document.getElementById('overdue-count').innerText = overdueOrders.length;
    document.getElementById('in-treatment-count').innerText = inTreatmentOrders.length;
    document.getElementById('treated-count').innerText = treatedOrders.length;

    setupDragAndDrop();
};

/**
 * Creates and appends a single kanban card.
 * @param {object} order The order object.
 * @param {HTMLElement} parentColumn The column to append the card to.
 */
const createKanbanCard = (order, parentColumn) => {
    const card = document.createElement('div');
    card.id = `kanban-card-${order['תעודה']}`;
    card.className = 'kanban-card p-4 rounded-lg shadow-md';
    card.setAttribute('draggable', true);
    card.dataset.id = order.id;

    card.innerHTML = `
        <div class="font-bold text-lg">${order['שם לקוח']}</div>
        <div class="text-sm text-text-light">${order['תאריך הזמנה']} - ${order['תעודה']}</div>
        <div class="text-sm mt-2">${order['הערות'] || ''}</div>
    `;
    parentColumn.appendChild(card);
};

/**
 * Sets up the drag-and-drop event listeners for the kanban board.
 */
const setupDragAndDrop = () => {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column div[id$="-column"]');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            dragged = card;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.id);
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            dragged.classList.remove('dragging');
            dragged = null;
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                if (afterElement == null) {
                    column.appendChild(draggable);
                } else {
                    column.insertBefore(draggable, afterElement);
                }
            }
        });
    });
};

/**
 * Finds the element to drop a dragged item after.
 * @param {HTMLElement} container The container element.
 * @param {number} y The Y coordinate of the drag event.
 * @returns {HTMLElement|null} The element to drop after.
 */
const getDragAfterElement = (container, y) => {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
};

/**
 * Handles the drop event on a kanban column.
 * @param {Event} event The drop event.
 */
export const handleDrop = async (event) => {
    event.preventDefault();
    const orderId = event.dataTransfer.getData('text/plain');
    const droppedOnColumnId = event.currentTarget.id;
    const order = state.orders.find(o => o.id === orderId);

    if (order) {
        let newStatus;
        if (droppedOnColumnId === 'overdue-column') {
            newStatus = 'חורג';
        } else if (droppedOnColumnId === 'in-treatment-column') {
            newStatus = 'בטיפול';
        } else if (droppedOnColumnId === 'treated-column') {
            newStatus = 'טופל';
        }

        if (newStatus && order['סטטוס'] !== newStatus) {
            try {
                await updateKanbanStatusApi(orderId, newStatus);
                showAlert(`סטטוס הזמנה ${order['תעודה']} עודכן ל: ${newStatus}`, 'success');
                await updateAllData();
            } catch (error) {
                showAlert(`שגיאה בעדכון סטטוס: ${error.message}`, 'error');
                // Re-render to revert local changes if API call fails
                renderKanbanBoard();
            }
        }
    }
};
