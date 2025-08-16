// js/main.js
// The main entry point for the application. Initializes all modules and listeners.

import {
    showPage,
    initializeTheme,
    toggleTheme,
    setupDateTimeDisplay,
    showLoader,
    hideLoader,
    showToast,
    isMobile,
    debounce,
    highlightText
} from './ui-and-utils.js';

import {
    renderOrdersTable,
    renderContainersTable,
    renderTreatmentTable,
    drawDashboardCharts,
    handleSort,
    handleStatusFilterChange,
    handleActionFilterChange,
    handleSearchInputChange,
    goToNextPage,
    goToPrevPage,
    updateAutocomplete
} from './tables-and-charts.js';

// Global application state
const state = {
    allOrders: [],
    filteredOrders: [],
    customers: [],
    documents: [],
    agents: [],
    containers: [],
    sites: [],
    filters: {
        searchTerm: '',
        statusFilter: 'all',
        actionFilter: 'all'
    },
    autocompleteCache: {
        customers: [],
        documents: [],
        agents: [],
        addresses: []
    }
};

let currentOrderId = null;
let currentContainerId = null;

/**
 * Initializes the application.
 */
const initializeApp = () => {
    initializeTheme();
    setupDateTimeDisplay();
    setupEventListeners();
    updateAllData();
    showPage('dashboard-page');
};

/**
 * Sets up all the event listeners for the application.
 */
const setupEventListeners = () => {
    // Navigation
    document.getElementById('desktop-nav').addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            showPage(e.target.closest('a').dataset.page);
        }
    });

    document.getElementById('mobile-nav').addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            showPage(e.target.closest('a').dataset.page);
        }
    });

    // Modals
    document.getElementById('add-order-btn').addEventListener('click', () => openOrderModal('add'));
    document.querySelector('#order-modal-overlay .modal-close-btn').addEventListener('click', () => closeOrderModal());
    document.querySelector('#add-container-modal-overlay .modal-close-btn').addEventListener('click', () => closeAddContainerModal());
    document.querySelector('#order-details-modal-overlay .modal-close-btn').addEventListener('click', () => closeOrderDetailsModal());
    
    // Form submissions
    document.getElementById('order-form').addEventListener('submit', handleOrderFormSubmit);
    document.getElementById('add-container-form').addEventListener('submit', handleAddContainerFormSubmit);

    // Autocomplete listeners for order form
    document.getElementById('order-customer').addEventListener('input', () => updateAutocomplete('order-customer', 'customer-autocomplete-list', state.autocompleteCache.customers));
    document.getElementById('order-document').addEventListener('input', () => updateAutocomplete('order-document', 'document-autocomplete-list', state.autocompleteCache.documents));
    document.getElementById('order-agent').addEventListener('input', () => updateAutocomplete('order-agent', 'agent-autocomplete-list', state.autocompleteCache.agents));
    document.getElementById('order-address').addEventListener('input', () => updateAutocomplete('order-address', 'address-autocomplete-list', state.autocompleteCache.addresses));

    // Order modal actions
    document.getElementById('close-order-btn').addEventListener('click', closeOrder);
    document.getElementById('delete-order-btn').addEventListener('click', deleteOrder);
    document.getElementById('duplicate-order-btn').addEventListener('click', duplicateOrder);

    // Table filters and pagination
    document.getElementById('status-filter').addEventListener('change', (e) => handleStatusFilterChange(state, e.target.value));
    document.getElementById('action-filter').addEventListener('change', (e) => handleActionFilterChange(state, e.target.value));
    document.getElementById('search-input').addEventListener('input', debounce((e) => handleSearchInputChange(state, e.target.value), 300));
    document.getElementById('next-page').addEventListener('click', () => goToNextPage(state));
    document.getElementById('prev-page').addEventListener('click', () => goToPrevPage(state));

    // Table sorting
    document.getElementById('orders-table-body').addEventListener('click', (e) => {
        const header = e.target.closest('th');
        if (header && header.dataset.sortBy) {
            handleSort(state, header);
        }
    });
    
    // Kanban board
    document.getElementById('overdue-column').addEventListener('drop', handleDrop);
    document.getElementById('in-treatment-column').addEventListener('drop', handleDrop);
    document.getElementById('treated-column').addEventListener('drop', handleDrop);
    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('dragover', (e) => e.preventDefault());
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.altKey && event.key === 'n') {
            event.preventDefault();
            openOrderModal('add');
        }
    });
};

/**
 * Fetches all data and updates the application state.
 */
const updateAllData = async () => {
    showLoader();
    try {
        const [ordersResponse, customersResponse, documentsResponse, agentsResponse, containersResponse, sitesResponse] = await Promise.all([
            fetch('data/orders.json'),
            fetch('data/customers.json'),
            fetch('data/documents.json'),
            fetch('data/agents.json'),
            fetch('data/containers.json'),
            fetch('data/sites.json')
        ]);

        if (!ordersResponse.ok || !customersResponse.ok || !documentsResponse.ok || !agentsResponse.ok || !containersResponse.ok || !sitesResponse.ok) {
            throw new Error("One or more data files failed to load.");
        }

        state.allOrders = await ordersResponse.json();
        state.customers = await customersResponse.json();
        state.documents = await documentsResponse.json();
        state.agents = await agentsResponse.json();
        state.containers = await containersResponse.json();
        state.sites = await sitesResponse.json();

        // Populate autocomplete cache
        state.autocompleteCache.customers = state.customers.map(c => c['שם לקוח']);
        state.autocompleteCache.documents = state.documents.map(d => d['מספר מסמך']);
        state.autocompleteCache.agents = state.agents.map(a => a['שם סוכן']);
        state.autocompleteCache.addresses = [...new Set(state.allOrders.map(o => o['כתובת']))];

        // Process orders data
        state.allOrders.forEach(order => {
            order.statusClass = getStatusClass(order['סטטוס']);
            order.overdueDays = calculateOverdueDays(order);
        });

        // Initial rendering
        renderOrdersTable(state);
        renderContainersTable(state);
        renderTreatmentTable(state);
        drawDashboardCharts(state);
        
        showToast('הנתונים נטענו בהצלחה!', 'success');

    } catch (error) {
        console.error("Error loading data:", error);
        showToast('שגיאה בטעינת הנתונים: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case 'פתוח': return 'status-open';
        case 'סגור': return 'status-closed';
        case 'חורג': return 'status-overdue';
        case 'מושהה': return 'status-warning';
        case 'ממתין': return 'status-pending';
        default: return '';
    }
};

const calculateOverdueDays = (order) => {
    if (order['סטטוס'] !== 'חורג' || !order['תאריך סיום צפוי']) {
        return 0;
    }
    const today = new Date();
    const expectedEndDate = new Date(order['תאריך סיום צפוי']);
    const diffTime = today - expectedEndDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
};

// Modals
const closeOrderModal = () => document.getElementById('order-modal-overlay').classList.remove('active');
const closeAddContainerModal = () => document.getElementById('add-container-modal-overlay').classList.remove('active');
const closeOrderDetailsModal = () => document.getElementById('order-details-modal-overlay').classList.remove('active');

const openOrderModal = (mode, id = null) => {
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
};

const handleOrderFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const orderData = Object.fromEntries(formData.entries());
    const orderId = document.getElementById('order-id-input').value;

    let success = false;
    if (orderId) {
        const orderIndex = state.allOrders.findIndex(o => o['מספר הזמנה'] === orderId);
        if (orderIndex !== -1) {
            state.allOrders[orderIndex] = { ...state.allOrders[orderIndex], ...orderData };
            success = true;
        }
    } else {
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
        closeOrderModal();
        showToast('ההזמנה נשמרה בהצלחה!', 'success');
        updateAllData();
    } else {
        showToast('שגיאה בשמירת ההזמנה.', 'error');
    }
};

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

const handleAddContainerFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const containerData = Object.fromEntries(formData.entries());
    
    if (!containerData['מספר מכולה']) {
        showToast('מספר מכולה הוא שדה חובה.', 'error');
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
    renderContainersTable(state);
    closeAddContainerModal();
    showToast('המכולה נוספה בהצלחה!', 'success');
};

const closeOrder = () => {
    if (currentOrderId) {
        const order = state.allOrders.find(o => o['מספר הזמנה'] === currentOrderId);
        if (order) {
            order['סטטוס'] = 'סגור';
            closeOrderModal();
            showToast('ההזמנה נסגרה בהצלחה!', 'success');
            updateAllData();
        }
    }
};

const deleteOrder = () => {
    if (currentOrderId) {
        state.allOrders = state.allOrders.filter(o => o['מספר הזמנה'] !== currentOrderId);
        closeOrderModal();
        showToast('ההזמנה נמחקה בהצלחה!', 'success');
        updateAllData();
    }
};

const duplicateOrder = () => {
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
            closeOrderModal();
            showToast('ההזמנה שוכפלה בהצלחה!', 'success');
            updateAllData();
        }
    }
};

const addPredefinedNote = (note) => {
    const notesField = document.getElementById('order-notes');
    notesField.value = notesField.value + `\n- ${note}`;
};

const showOrderDetails = (id) => {
    const order = state.allOrders.find(o => o['מספר הזמנה'] === id);
    if (!order) {
        showToast('הזמנה לא נמצאה!', 'error');
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

const showContainerHistory = (containerId) => {
    showToast(`היסטוריית מכולה: ${containerId}`, 'info');
};

const showContainersAtSites = (site) => {
    showToast(`מכולות באתר: ${site}`, 'info');
};

const handleDragStart = (event) => {
    event.dataTransfer.setData('text/plain', event.target.dataset.id);
    event.dataTransfer.effectAllowed = 'move';
};

const handleDrop = (event) => {
    event.preventDefault();
    const orderId = event.dataTransfer.getData('text/plain');
    const targetColumn = event.currentTarget.id;

    const order = state.allOrders.find(o => o['מספר הזמנה'] === orderId);
    if (!order) {
        showToast('הזמנה לא נמצאה!', 'error');
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
        showToast(`סטטוס הזמנה ${orderId} עודכן בהצלחה ל"${newStatus}"`, 'success');
        updateAllData();
    }
};

// Expose functions to the global scope for event handlers defined in HTML
window.openOrderModal = openOrderModal;
window.showOrderDetails = showOrderDetails;
window.showContainerHistory = showContainerHistory;
window.showContainersAtSites = showContainersAtSites;
window.addPredefinedNote = addPredefinedNote;
window.closeOrder = closeOrder;
window.deleteOrder = deleteOrder;
window.duplicateOrder = duplicateOrder;

window.onload = initializeApp;
