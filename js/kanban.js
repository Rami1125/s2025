// js/kanban.js
// Handles the Kanban board drag-and-drop and logic.

import { state } from './state.js';
import { updateAllData } from './data.js';
import { showToast } from './ui.js'; // התיקון: מייבאים showToast במקום showAlert

/**
 * Renders the Kanban board with the given orders.
 * @param {Array<Object>} orders The list of orders to render.
 */
export const renderKanbanBoard = (orders) => {
    const overdueColumn = document.getElementById('overdue-column');
    const inTreatmentColumn = document.getElementById('in-treatment-column');
    const treatedColumn = document.getElementById('treated-column');
    
    // Clear columns
    overdueColumn.innerHTML = '';
    inTreatmentColumn.innerHTML = '';
    treatedColumn.innerHTML = '';

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = `bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md mb-4 cursor-grab`;
        card.setAttribute('draggable', true);
        card.dataset.id = order['מספר הזמנה'];
        card.innerHTML = `
            <h4 class="font-bold text-gray-900 dark:text-gray-100">${order['מספר הזמנה']}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">לקוח: ${order['שם לקוח']}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">סטטוס: ${order['סטטוס']}</p>
        `;
        
        card.addEventListener('dragstart', handleDragStart);

        if (order['סטטוס'] === 'חורג') {
            overdueColumn.appendChild(card);
        } else if (order['סטטוס'] === 'בטיפול') {
            inTreatmentColumn.appendChild(card);
        } else if (order['סטטוס'] === 'טופל') {
            treatedColumn.appendChild(card);
        }
    });
};

/**
 * Handles the dragstart event for a Kanban card.
 * @param {Event} event The drag event.
 */
const handleDragStart = (event) => {
    event.dataTransfer.setData('text/plain', event.target.dataset.id);
    event.dataTransfer.effectAllowed = 'move';
};

/**
 * Handles the drop event for a Kanban column.
 * @param {Event} event The drop event.
 */
export const handleDrop = (event) => {
    event.preventDefault();
    const orderId = event.dataTransfer.getData('text/plain');
    const targetColumn = event.currentTarget.id;

    const order = state.allOrders.find(o => o['מספר הזמנה'] === orderId);
    if (!order) {
        showToast('הזמנה לא נמצאה!', 'error'); // התיקון: קוראים ל-showToast
        return;
    }

    let newStatus = '';
    switch (targetColumn) {
        case 'overdue-column':
            newStatus = 'חורג';
            break;
        case 'in-treatment-column':
            newStatus = 'בטיפול';
            break;
        case 'treated-column':
            newStatus = 'טופל';
            break;
    }

    if (newStatus && order['סטטוס'] !== newStatus) {
        order['סטטוס'] = newStatus;
        showToast(`סטטוס הזמנה ${orderId} עודכן בהצלחה ל"${newStatus}"`, 'success'); // התיקון: קוראים ל-showToast
        updateAllData(); // Re-render the entire app to reflect changes
    }
};
