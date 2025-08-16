// js/data.js
// Handles fetching and processing of all application data.

import { state } from './state.js';
import { fetchAllOrders } from './api.js';
import { renderDashboard } from './dashboard.js';
import { renderOrdersTable, updateAutocomplete } from './tables.js';
import { renderInventoryTables } from './inventory.js';
import { renderKanbanBoard } from './kanban.js';
import { showAlert } from './ui.js';

/**
 * Fetches all orders from the API and updates the application state.
 */
export const updateAllData = async () => {
    try {
        const orders = await fetchAllOrders();
        state.orders = orders;
        
        // Process data for dashboard, tables, etc.
        updateAutocompleteCache();
        
        renderDashboard();
        renderOrdersTable();
        renderInventoryTables();
        renderKanbanBoard();
        
    } catch (error) {
        console.error('Failed to fetch data:', error);
        showAlert('שגיאה בטעינת נתונים: ' + error.message, 'error');
    }
};

/**
 * Updates the autocomplete cache from the current orders data.
 */
const updateAutocompleteCache = () => {
    const allCustomers = [...new Set(state.orders.map(o => o['שם לקוח']).filter(Boolean))];
    const allAgents = [...new Set(state.orders.map(o => o['סוכן']).filter(Boolean))];
    const allDocuments = [...new Set(state.orders.map(o => o['תעודה']).filter(Boolean))];
    const allAddresses = [...new Set(state.orders.map(o => o['כתובת']).filter(Boolean))];
    
    state.autocompleteCache.customers = allCustomers;
    state.autocompleteCache.agents = allAgents;
    state.autocompleteCache.documents = allDocuments;
    state.autocompleteCache.addresses = allAddresses;
};
