// js/state.js
// Manages the global application state.

export const state = {
    orders: [],
    autocompleteCache: {
        customers: [],
        agents: [],
        documents: [],
        addresses: []
    },
    statusFilter: 'all',
    actionFilter: 'all',
    searchQuery: '',
    sortColumn: 'תאריך הזמנה',
    sortDirection: 'desc',
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
};
