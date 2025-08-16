// js/dashboard.js
// Handles the dashboard logic, including rendering charts and stats.

import { state } from './state.js';
import { drawCharts } from './charts.js';

const openOrdersCountElem = document.getElementById('open-orders-count');
const overdueOrdersCountElem = document.getElementById('overdue-orders-count');
const inUseContainersCountElem = document.getElementById('in-use-containers-count');
const activeCustomersCountElem = document.getElementById('active-customers-count');

/**
 * Renders all dashboard elements, including stats and charts.
 */
export const renderDashboard = () => {
    updateDashboardStats();
    drawCharts(state.orders);
};

/**
 * Updates the quick stats on the dashboard.
 */
const updateDashboardStats = () => {
    const openOrders = state.orders.filter(order => order['סטטוס'] === 'פתוח' || order['סטטוס'] === 'ממתין/לא תקין');
    const overdueOrders = state.orders.filter(order => order['סטטוס'] === 'חורג');
    const inUseContainers = state.orders.filter(order => order['סטטוס'] !== 'סגור' && order['פעולה'] === 'הורדה');
    const activeCustomers = [...new Set(state.orders.map(order => order['שם לקוח']))].length;

    openOrdersCountElem.innerText = openOrders.length;
    overdueOrdersCountElem.innerText = overdueOrders.length;
    inUseContainersCountElem.innerText = inUseContainers.length;
    activeCustomersCountElem.innerText = activeCustomers;
};
