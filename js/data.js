// js/data.js

import { state } from './state.js';
import { renderOrdersTable, renderContainersTable, renderTreatmentTable } from './tables.js';
import { drawDashboardCharts } from './charts.js';
import { showToast, showLoader, hideLoader } from './ui.js'; // ייבוא showLoader ו-hideLoader

/**
 * Fetches all data and updates the application state.
 */
export const updateAllData = async () => {
    showLoader(); // הצגת מסך הטעינה
    console.log("Starting data fetch...");
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
        renderOrdersTable(state.allOrders);
        renderContainersTable(state.containers);
        renderTreatmentTable(state.allOrders);
        drawDashboardCharts(state.allOrders);
        
        console.log("Data loaded and rendered successfully.");

    } catch (error) {
        console.error("Error loading data:", error);
        showToast('שגיאה בטעינת הנתונים: ' + error.message, 'error');
    } finally {
        hideLoader(); // הסתרת מסך הטעינה בסיום התהליך
    }
};

/**
 * Determines the CSS class for an order's status.
 * @param {string} status The order status.
 * @returns {string} The corresponding CSS class.
 */
const getStatusClass = (status) => {
    switch (status) {
        case 'פתוח':
            return 'status-open';
        case 'סגור':
            return 'status-closed';
        case 'חורג':
            return 'status-overdue';
        case 'מושהה':
            return 'status-warning';
        case 'ממתין':
            return 'status-pending';
        default:
            return '';
    }
};

/**
 * Calculates the number of days an order is overdue.
 * @param {object} order The order object.
 * @returns {number} The number of overdue days.
 */
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
