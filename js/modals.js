// js/modals.js
// Manages the logic for all modals, including forms and data display.

import { state } from './state.js';
import { addOrderApi, editOrderApi, closeOrderApi, deleteOrderApi, addNewContainerApi, fetchContainerHistoryApi } from './api.js';
import { updateAllData } from './data.js';
import { showAlert } from './ui.js';
import { formatDate } from './utils.js';
import { renderOrdersTable } from './tables.js';

let currentEditingOrder = null;

const orderModalOverlay = document.getElementById('order-modal-overlay');
const orderModal = document.getElementById('order-modal');
const orderForm = document.getElementById('order-form');
const orderDetailsPane = document.getElementById('order-details-pane');
const deleteModalOverlay = document.getElementById('delete-modal-overlay');
const containersAtSitesModalOverlay = document.getElementById('containers-at-sites-modal-overlay');
const addNewContainerModalOverlay = document.getElementById('add-new-container-modal-overlay');
const addContainerForm = document.getElementById('add-container-form');
const containerHistoryModalOverlay = document.getElementById('container-history-modal-overlay');

/**
 * Opens a generic modal.
 * @param {HTMLElement} modalOverlay The modal overlay element.
 */
const openModal = (modalOverlay) => {
    modalOverlay.classList.remove('hidden');
    // For smaller screens, use a drawer effect
    if (window.innerWidth < 768) {
        modalOverlay.classList.add('mobile-drawer');
    }
    modalOverlay.classList.add('active');
};

/**
 * Closes a generic modal.
 * @param {HTMLElement} modalOverlay The modal overlay element.
 */
const closeModal = (modalOverlay) => {
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        // Hide after animation
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            modalOverlay.classList.remove('mobile-drawer');
        }, 300);
    }
};

/**
 * Opens the order form modal.
 * @param {string} mode 'add' or 'edit'.
 * @param {string} orderId The ID of the order to edit.
 */
export const openOrderModal = (mode, orderId = null) => {
    document.getElementById('modal-title').innerText = mode === 'add' ? 'הוספת הזמנה חדשה' : 'עריכת הזמנה';
    document.getElementById('submit-btn').innerText = mode === 'add' ? 'שמור הזמנה' : 'עדכן הזמנה';
    document.getElementById('order-modal-actions').classList.add('hidden');
    orderDetailsPane.classList.add('hidden');
    orderForm.reset();
    document.getElementById('finish-date-container').classList.add('hidden');
    currentEditingOrder = null;

    if (mode === 'edit' && orderId) {
        currentEditingOrder = state.orders.find(o => o['תעודה'] === orderId);
        if (currentEditingOrder) {
            fillOrderForm(currentEditingOrder);
            document.getElementById('order-modal-actions').classList.remove('hidden');
            if (currentEditingOrder['סטטוס'] === 'סגור' || currentEditingOrder['סטטוס'] === 'ממתין/לא תקין') {
                document.getElementById('close-order-btn').classList.add('hidden');
            } else {
                document.getElementById('close-order-btn').classList.remove('hidden');
            }
        }
    }

    openModal(orderModalOverlay);
};

const fillOrderForm = (order) => {
    document.getElementById('order-id').value = order.id || '';
    document.getElementById('order-date').value = order['תאריך הזמנה'] ? formatDate(order['תאריך הזמנה']) : '';
    document.getElementById('order-document').value = order['תעודה'] || '';
    document.getElementById('order-agent').value = order['סוכן'] || '';
    document.getElementById('order-customer').value = order['שם לקוח'] || '';
    document.getElementById('order-address').value = order['כתובת'] || '';
    document.getElementById('order-action').value = order['פעולה'] || '';
    document.getElementById('order-container-numbers').value = order['מספרים מכולה'] || '';
    document.getElementById('order-notes').value = order['הערות'] || '';
    document.getElementById('order-expected-end-date').value = order['תאריך סיום צפוי'] ? formatDate(order['תאריך סיום צפוי']) : '';
    
    // Disable inputs for closed orders
    const inputs = orderForm.querySelectorAll('input, select, textarea');
    if (order['סטטוס'] === 'סגור') {
        inputs.forEach(input => input.disabled = true);
        document.getElementById('submit-btn').classList.add('hidden');
    } else {
        inputs.forEach(input => input.disabled = false);
        document.getElementById('submit-btn').classList.remove('hidden');
    }
};

export const closeOrderModal = () => closeModal(orderModalOverlay);
export const showDeleteConfirmation = () => openModal(deleteModalOverlay);
export const closeDeleteConfirmation = () => closeModal(deleteModalOverlay);
export const openAddNewContainerModal = () => openModal(addNewContainerModalOverlay);
export const closeAddNewContainerModal = () => closeModal(addNewContainerModalOverlay);
export const openContainerHistoryModal = () => openModal(containerHistoryModalOverlay);
export const closeContainerHistoryModal = () => closeModal(containerHistoryModalOverlay);
export const openContainersAtSitesModal = () => openModal(containersAtSitesModalOverlay);
export const closeContainersAtSitesModal = () => closeModal(containersAtSitesModalOverlay);

/**
 * Handles the submission of the order form.
 * @param {Event} event The form submission event.
 */
export const handleOrderFormSubmit = async (event) => {
    event.preventDefault();
    const isEditing = !!currentEditingOrder;
    const orderId = isEditing ? currentEditingOrder.id : null;
    const form = new FormData(event.target);
    const orderData = Object.fromEntries(form.entries());

    document.getElementById('submit-loader').classList.remove('hidden');
    document.getElementById('submit-btn').disabled = true;

    try {
        const responseData = isEditing
            ? await editOrderApi(orderId, orderData)
            : await addOrderApi(orderData);

        if (responseData) {
            showAlert(`הזמנה עודכנה בהצלחה: ${responseData['תעודה']}`, 'success');
            closeOrderModal();
            await updateAllData();
        }
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        document.getElementById('submit-loader').classList.add('hidden');
        document.getElementById('submit-btn').disabled = false;
    }
};

/**
 * Handles the submission of the add new container form.
 * @param {Event} event The form submission event.
 */
export const handleAddContainerFormSubmit = async (event) => {
    event.preventDefault();
    const containerNumber = document.getElementById('new-container-number').value.trim();

    if (!containerNumber) {
        showAlert('יש להזין מספר מכולה.', 'warning');
        return;
    }
    
    document.getElementById('add-container-loader').classList.remove('hidden');
    document.getElementById('add-container-btn').disabled = true;

    try {
        const response = await addNewContainerApi(containerNumber);
        showAlert(`מכולה ${response.number} נוספה בהצלחה!`, 'success');
        closeAddNewContainerModal();
        await updateAllData();
    } catch (error) {
        showAlert(`שגיאה בהוספת מכולה: ${error.message}`, 'error');
    } finally {
        document.getElementById('add-container-loader').classList.add('hidden');
        document.getElementById('add-container-btn').disabled = false;
    }
};

/**
 * Closes an order.
 */
export const closeOrder = async () => {
    const finishDate = prompt('נא להזין תאריך סיום (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!finishDate) return;

    try {
        await closeOrderApi(currentEditingOrder.id, { finishDate });
        showAlert(`הזמנה ${currentEditingOrder['תעודה']} נסגרה בהצלחה.`, 'success');
        closeOrderModal();
        await updateAllData();
    } catch (error) {
        showAlert(`שגיאה בסגירת הזמנה: ${error.message}`, 'error');
    }
};

/**
 * Deletes an order.
 */
export const deleteOrder = async () => {
    try {
        await deleteOrderApi(currentEditingOrder.id);
        showAlert(`הזמנה ${currentEditingOrder['תעודה']} נמחקה בהצלחה.`, 'success');
        closeDeleteConfirmation();
        closeOrderModal();
        await updateAllData();
    } catch (error) {
        showAlert(`שגיאה במחיקת הזמנה: ${error.message}`, 'error');
    }
};

/**
 * Duplicates an existing order.
 */
export const duplicateOrder = () => {
    if (currentEditingOrder) {
        const newOrder = { ...currentEditingOrder, id: null, 'תעודה': '' };
        document.getElementById('modal-title').innerText = 'שכפול הזמנה';
        document.getElementById('order-modal-actions').classList.add('hidden');
        document.getElementById('submit-btn').innerText = 'שמור שכפול';
        fillOrderForm(newOrder);
        showAlert('ההזמנה שוכפלה. ערוך את הפרטים ושמור.', 'info', 5000);
    }
};

/**
 * Adds a predefined note to the notes field.
 * @param {string} note The note text to add.
 */
export const addPredefinedNote = (note) => {
    const notesField = document.getElementById('order-notes');
    if (notesField) {
        notesField.value = notesField.value ? `${notesField.value}\n${note}` : note;
    }
};

/**
 * Displays detailed information about a specific order.
 * @param {string} orderId The ID of the order to display.
 */
export const showOrderDetails = (orderId) => {
    const order = state.orders.find(o => o['תעודה'] === orderId);
    if (!order) return;

    const detailsContainer = document.getElementById('order-details-container');
    detailsContainer.innerHTML = '';
    
    // Render order details
    for (const key in order) {
        if (order[key]) {
            const detailItem = document.createElement('div');
            detailItem.innerHTML = `<span class="font-bold">${key}:</span> ${order[key]}`;
            detailsContainer.appendChild(detailItem);
        }
    }

    // Render customer history
    const customerHistoryList = document.getElementById('customer-history-list');
    customerHistoryList.innerHTML = '';
    const customerOrders = state.orders.filter(o => o['שם לקוח'] === order['שם לקוח']).sort((a,b) => new Date(b['תאריך הזמנה']) - new Date(a['תאריך הזמנה']));
    
    customerOrders.forEach(custOrder => {
        const historyItem = document.createElement('div');
        historyItem.className = 'p-2 bg-white rounded-md shadow-sm';
        historyItem.innerHTML = `
            <div class="font-bold">${custOrder['תאריך הזמנה']} - ${custOrder['תעודה']}</div>
            <div class="text-sm text-text-light">${custOrder['פעולה']} - ${custOrder['מספרים מכולה']}</div>
        `;
        customerHistoryList.appendChild(historyItem);
    });

    orderDetailsPane.classList.remove('hidden');
};

/**
 * Renders the history of a specific container in a modal.
 * @param {string} containerNumber The container number to display history for.
 */
export const showContainerHistory = async (containerNumber) => {
    try {
        const historyData = await fetchContainerHistoryApi(containerNumber);
        
        const historyList = document.getElementById('container-history-list');
        historyList.innerHTML = '';
        document.getElementById('container-history-number').innerText = containerNumber;

        if (historyData && historyData.length > 0) {
            historyData.forEach(entry => {
                const historyItem = document.createElement('div');
                historyItem.className = 'p-4 bg-background-light rounded-lg shadow-md';
                historyItem.innerHTML = `
                    <p class="font-bold text-lg">${entry['פעולה']} - ${formatDate(entry['תאריך'])}</p>
                    <p>לקוח: ${entry['שם לקוח'] || 'לא ידוע'}</p>
                    <p>תעודה: ${entry['תעודה'] || 'לא ידוע'}</p>
                    <p>הערות: ${entry['הערות'] || 'אין'}</p>
                `;
                historyList.appendChild(historyItem);
            });
        } else {
            historyList.innerHTML = '<p class="text-center text-text-light">אין היסטוריה למכולה זו.</p>';
        }

        openContainerHistoryModal();
    } catch (error) {
        showAlert(`שגיאה בטעינת היסטוריית מכולה: ${error.message}`, 'error');
    }
};

/**
 * Renders a list of containers and their current locations in a modal.
 */
export const showContainersAtSites = () => {
    const containersAtSitesList = document.getElementById('containers-at-sites-list');
    containersAtSitesList.innerHTML = '';
    const inUseContainers = state.orders.filter(o => o['סטטוס'] !== 'סגור' && o['פעולה'] === 'הורדה');
    
    const locations = {};
    inUseContainers.forEach(order => {
        const key = `${order['שם לקוח']} - ${order['כתובת']}`;
        if (!locations[key]) {
            locations[key] = [];
        }
        locations[key].push(...(order['מספרים מכולה'] ? order['מספרים מכולה'].split(',').map(n => n.trim()) : []));
    });

    for (const location in locations) {
        const locationItem = document.createElement('div');
        locationItem.className = 'p-4 bg-background-light rounded-lg shadow-md';
        locationItem.innerHTML = `
            <h3 class="font-bold text-lg">${location}</h3>
            <ul class="list-disc pr-6">
                ${locations[location].map(container => `<li>${container}</li>`).join('')}
            </ul>
        `;
        containersAtSitesList.appendChild(locationItem);
    }
    
    if (Object.keys(locations).length === 0) {
        containersAtSitesList.innerHTML = '<p class="text-center text-text-light">אין מכולות בשימוש כרגע.</p>';
    }

    openContainersAtSitesModal();
};
