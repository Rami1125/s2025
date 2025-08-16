// js/modals.js
// Handles all modal-related logic, including opening, closing, and form submissions.

import { state } from './state.js';
import { updateAllData } from './data.js';
import { renderOrdersTable, renderContainersTable } from './tables.js';
import { isMobile } from './utils.js';
import { showToast } from './ui.js'; // התיקון: מייבאים showToast במקום showAlert

// Globals
let currentOrderId = null;
let currentContainerId = null;

/**
 * Opens a modal.
 * @param {string} modalId The ID of the modal to open.
 * @param {string} mode The mode of the modal ('add' or 'edit').
 * @param {string|number|null} id The ID of the item to edit.
 */
export const openOrderModal = (mode, id = null) => {
    const modal = document.getElementById('order-modal-overlay');
    const form = document.getElementById('order-form');
    const title = document.getElementById('order-modal-title');
    const closeOrderBtn = document.getElementById('close-order-btn');
    const deleteOrderBtn = document.getElementById('delete-order-btn');

    form.reset();
    document.getElementById('order-id-input').value = '';
    currentOrderId = id;

    if (mode === 'add') {
        title.textContent = 'הוספת הזמנה חדשה';
        document.getElementById('add-note-section').classList.add('hidden');
        document.getElementById('additional-actions').classList.add('hidden');
        closeOrderBtn.classList.add('hidden');
        deleteOrderBtn.classList.add('hidden');
    } else if (mode === 'edit') {
        title.textContent = 'עריכת הזמנה קיימת';
        const order = state.allOrders.find(o => o['מספר הזמנה'] === id);
        if (order) {
            populateOrderForm(order);
            document.getElementById('add-note-section').classList.remove('hidden');
            document.getElementById('additional-actions').classList.remove('hidden');
            closeOrderBtn.classList.toggle('hidden', order['סטטוס'] !== 'פתוח');
            deleteOrderBtn.classList.remove('hidden');
        }
    }

    modal.classList.add('active');
    if (isMobile()) {
        modal.classList.add('mobile-drawer');
    } else {
        modal.classList.remove('mobile-drawer');
    }
};

/**
 * Handles the order form submission.
 * @param {Event} event The form submission event.
 */
export const handleOrderFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const orderData = Object.fromEntries(formData.entries());
    const orderId = document.getElementById('order-id-input').value;

    let success = false;
    if (orderId) {
        // Edit existing order
        const orderIndex = state.allOrders.findIndex(o => o['מספר הזמנה'] === orderId);
        if (orderIndex !== -1) {
            state.allOrders[orderIndex] = { ...state.allOrders[orderIndex], ...orderData };
            success = true;
        }
    } else {
        // Add new order
        const newId = `ORD-${Date.now()}`;
        const newOrder = {
            "מספר הזמנה": newId,
            ...orderData,
            "תאריך יצירה": new Date().toISOString().split('T')[0],
            "סטטוס": "פתוח"
        };
        state.allOrders.push(newOrder);
        success = true;
    }

    if (success) {
        document.getElementById('order-modal-overlay').classList.remove('active');
        showToast('ההזמנה נשמרה בהצלחה!', 'success'); // התיקון: קוראים ל-showToast
        updateAllData();
    } else {
        showToast('שגיאה בשמירת ההזמנה.', 'error'); // התיקון: קוראים ל-showToast
    }
};

/**
 * Populates the order form with existing data for editing.
 * @param {object} order The order object.
 */
const populateOrderForm = (order) => {
    document.getElementById('order-id-input').value = order['מספר הזמנה'] || '';
    document.getElementById('order-customer').value = order['שם לקוח'] || '';
    document.getElementById('order-document').value = order['מספר מסמך'] || '';
    document.getElementById('order-agent').value = order['שם סוכן'] || '';
    document.getElementById('order-address').value = order['כתובת'] || '';
    document.getElementById('order-notes').value = order['הערות'] || '';
    document.getElementById('order-status').value = order['סטטוס'] || 'פתוח';
    document.getElementById('order-expected-end-date').value = order['תאריך סיום צפוי'] || '';
};

/**
 * Handles the add container form submission.
 * @param {Event} event The form submission event.
 */
export const handleAddContainerFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const containerData = Object.fromEntries(formData.entries());
    
    // Simple validation
    if (!containerData['מספר מכולה']) {
        showToast('מספר מכולה הוא שדה חובה.', 'error'); // התיקון: קוראים ל-showToast
        return;
    }

    const newContainer = {
        "מספר מכולה": containerData['מספר מכולה'],
        "סטטוס": "פנוי",
        "מיקום": containerData['מיקום'],
        "תאריך אחרון במלאי": new Date().toISOString().split('T')[0],
        "הערות": containerData['הערות']
    };
    
    state.containers.push(newContainer);
    renderContainersTable(state.containers);
    document.getElementById('add-container-form').reset();
    showToast('המכולה נוספה בהצלחה!', 'success'); // התיקון: קוראים ל-showToast
};

/**
 * Closes an order.
 */
export const closeOrder = () => {
    if (currentOrderId) {
        const order = state.allOrders.find(o => o['מספר הזמנה'] === currentOrderId);
        if (order) {
            order['סטטוס'] = 'סגור';
            document.getElementById('order-modal-overlay').classList.remove('active');
            showToast('ההזמנה נסגרה בהצלחה!', 'success'); // התיקון: קוראים ל-showToast
            updateAllData();
        }
    }
};

/**
 * Deletes an order.
 */
export const deleteOrder = () => {
    if (currentOrderId) {
        state.allOrders = state.allOrders.filter(o => o['מספר הזמנה'] !== currentOrderId);
        document.getElementById('delete-modal-overlay').classList.add('hidden');
        document.getElementById('order-modal-overlay').classList.remove('active');
        showToast('ההזמנה נמחקה בהצלחה!', 'success'); // התיקון: קוראים ל-showToast
        updateAllData();
    }
};

/**
 * Duplicates an order.
 */
export const duplicateOrder = () => {
    if (currentOrderId) {
        const order = state.allOrders.find(o => o['מספר הזמנה'] === currentOrderId);
        if (order) {
            const newId = `ORD-${Date.now()}-dup`;
            const newOrder = {
                ...order,
                "מספר הזמנה": newId,
                "תאריך יצירה": new Date().toISOString().split('T')[0],
                "סטטוס": "פתוח"
            };
            state.allOrders.push(newOrder);
            document.getElementById('order-modal-overlay').classList.remove('active');
            showToast('ההזמנה שוכפלה בהצלחה!', 'success'); // התיקון: קוראים ל-showToast
            updateAllData();
        }
    }
};

/**
 * Adds a predefined note to the current order.
 * @param {string} note The predefined note to add.
 */
export const addPredefinedNote = (note) => {
    const notesField = document.getElementById('order-notes');
    notesField.value = notesField.value + `\n- ${note}`;
};

/**
 * Shows the full details of an order in a modal.
 * @param {string|number} id The ID of the order.
 */
export const showOrderDetails = (id) => {
    const order = state.allOrders.find(o => o['מספר הזמנה'] === id);
    if (!order) {
        showToast('הזמנה לא נמצאה!', 'error'); // התיקון: קוראים ל-showToast
        return;
    }

    const modal = document.getElementById('order-details-modal-overlay');
    const content = document.getElementById('order-details-content');
    content.innerHTML = `
        <h3 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">פרטי הזמנה: ${order['מספר הזמנה']}</h3>
        <p><strong>לקוח:</strong> ${order['שם לקוח'] || 'לא צוין'}</p>
        <p><strong>מספר מסמך:</strong> ${order['מספר מסמך'] || 'לא צוין'}</p>
        <p><strong>סוכן:</strong> ${order['שם סוכן'] || 'לא צוין'}</p>
        <p><strong>כתובת:</strong> ${order['כתובת'] || 'לא צוין'}</p>
        <p><strong>סטטוס:</strong> ${order['סטטוס'] || 'לא צוין'}</p>
        <p><strong>תאריך יצירה:</strong> ${order['תאריך יצירה'] || 'לא צוין'}</p>
        <p><strong>תאריך סיום צפוי:</strong> ${order['תאריך סיום צפוי'] || 'לא צוין'}</p>
        <p><strong>הערות:</strong> ${order['הערות'] || 'אין'}</p>
    `;
    modal.classList.add('active');
};

/**
 * Shows the history of a specific container in a modal.
 * @param {string} containerId The ID of the container.
 */
export const showContainerHistory = (containerId) => {
    showToast(`היסטוריית מכולה: ${containerId}`, 'info'); // התיקון: קוראים ל-showToast
    // Logic to fetch and display container history (not implemented yet)
};

/**
 * Shows all containers at a specific site in a modal.
 * @param {string} site The site name.
 */
export const showContainersAtSites = (site) => {
    showToast(`מכולות באתר: ${site}`, 'info'); // התיקון: קוראים ל-showToast
    // Logic to fetch and display containers at a site (not implemented yet)
};
