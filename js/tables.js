// js/tables.js
// Handles the rendering, filtering, and sorting of the orders table.

import { state } from './state.js';
import { openOrderModal, showOrderDetails, showContainerHistory } from './modals.js';
import { formatDate, calculateOverdueDays, highlightText } from './utils.js';

const ordersTableBody = document.getElementById('orders-table-body');
const paginationInfo = document.getElementById('pagination-info');
const noResultsMessage = document.getElementById('no-results');
const itemsPerPage = 15;

/**
 * Renders the orders table with the current state data.
 */
export const renderOrdersTable = () => {
    const filteredAndSortedOrders = getFilteredAndSortedOrders();
    state.totalItems = filteredAndSortedOrders.length;
    state.totalPages = Math.ceil(state.totalItems / itemsPerPage);

    const startIndex = (state.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

    ordersTableBody.innerHTML = '';
    if (paginatedOrders.length === 0) {
        noResultsMessage.classList.remove('hidden');
    } else {
        noResultsMessage.classList.add('hidden');
        paginatedOrders.forEach(order => {
            const row = createOrderRow(order);
            ordersTableBody.appendChild(row);
        });
    }

    updatePaginationControls();
};

/**
 * Creates a single table row for an order.
 * @param {object} order The order object.
 * @returns {HTMLTableRowElement} The created table row element.
 */
const createOrderRow = (order) => {
    const row = document.createElement('tr');
    row.className = `border-b ${order['סטטוס'] === 'סגור' ? 'text-text-light' : ''}`;
    
    const overdueDays = calculateOverdueDays(order);
    const overdueClass = overdueDays > 0 ? 'text-red-500 font-bold' : '';
    const statusClass = order['סטטוס'] === 'חורג' ? 'text-red-500' :
                        order['סטטוס'] === 'סגור' ? 'text-green-500' : '';
                        
    const searchTerm = state.searchQuery.toLowerCase();
    
    const highlightedCustomer = highlightText(order['שם לקוח'], searchTerm);
    const highlightedDocument = highlightText(order['תעודה'], searchTerm);

    const containerNumbersHtml = order['מספרים מכולה'] ? order['מספרים מכולה'].split(',').map(num => 
        `<button class="text-primary-brand hover:underline p-0 m-0 bg-transparent border-none" onclick="showContainerHistory('${num.trim()}')">${num.trim()}</button>`
    ).join(', ') : '';

    row.innerHTML = `
        <td class="py-3 px-6 whitespace-nowrap">
            <button onclick="openOrderModal('edit', '${order['תעודה']}')" class="text-accent-color hover:underline">ערוך</button>
            <button onclick="showOrderDetails('${order['תעודה']}')" class="text-accent-color hover:underline ml-2">הצג</button>
        </td>
        <td class="py-3 px-6 whitespace-nowrap ${overdueClass}">${overdueDays}</td>
        <td class="py-3 px-6 whitespace-nowrap ${statusClass}">${order['סטטוס'] || ''}</td>
        <td class="py-3 px-6 whitespace-nowrap">${containerNumbersHtml}</td>
        <td class="py-3 px-6 whitespace-nowrap">${order['פעולה'] || ''}</td>
        <td class="py-3 px-6 whitespace-nowrap">${highlightText(order['כתובת'], searchTerm)}</td>
        <td class="py-3 px-6 whitespace-nowrap">${highlightedCustomer}</td>
        <td class="py-3 px-6 whitespace-nowrap">${highlightText(order['סוכן'], searchTerm)}</td>
        <td class="py-3 px-6 whitespace-nowrap">${highlightedDocument}</td>
        <td class="py-3 px-6 whitespace-nowrap">${order['תאריך הזמנה'] ? formatDate(order['תאריך הזמנה']) : ''}</td>
    `;
    return row;
};

/**
 * Filters and sorts the orders based on the current state.
 * @returns {Array} The filtered and sorted array of orders.
 */
const getFilteredAndSortedOrders = () => {
    let filteredOrders = state.orders;

    // Filter by status
    if (state.statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order['סטטוס'] === state.statusFilter);
    }
    
    // Filter by action
    if (state.actionFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order['פעולה'] === state.actionFilter);
    }

    // Filter by search query
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
            Object.values(order).some(val => 
                val && String(val).toLowerCase().includes(query)
            )
        );
    }

    // Sort
    if (state.sortColumn) {
        const sortDirection = state.sortDirection === 'asc' ? 1 : -1;
        filteredOrders.sort((a, b) => {
            const valA = a[state.sortColumn];
            const valB = b[state.sortColumn];
            
            if (state.sortColumn === 'תאריך הזמנה' || state.sortColumn === 'ימי חריגה') {
                const dateA = new Date(valA);
                const dateB = new Date(valB);
                return (dateA - dateB) * sortDirection;
            }
            
            if (valA < valB) return -1 * sortDirection;
            if (valA > valB) return 1 * sortDirection;
            return 0;
        });
    }

    return filteredOrders;
};

/**
 * Updates the pagination info and button states.
 */
const updatePaginationControls = () => {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    paginationInfo.innerText = `עמוד ${state.currentPage} מתוך ${state.totalPages} (${state.totalItems} תוצאות)`;
    prevBtn.disabled = state.currentPage === 1;
    nextBtn.disabled = state.currentPage === state.totalPages;
};

/**
 * Handles the click on a table header for sorting.
 * @param {HTMLElement} header The clicked header element.
 */
export const handleSort = (header) => {
    const sortBy = header.dataset.sortBy;
    if (state.sortColumn === sortBy) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        document.querySelectorAll('.table-header th').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
        state.sortColumn = sortBy;
        state.sortDirection = 'asc';
    }
    
    header.classList.add(`sorted-${state.sortDirection}`);
    
    renderOrdersTable();
};

/**
 * Handles the change of the status filter.
 * @param {string} value The selected status value.
 */
export const handleStatusFilterChange = (value) => {
    state.statusFilter = value;
    state.currentPage = 1;
    renderOrdersTable();
};

/**
 * Handles the change of the action filter.
 * @param {string} value The selected action value.
 */
export const handleActionFilterChange = (value) => {
    state.actionFilter = value;
    state.currentPage = 1;
    renderOrdersTable();
};

/**
 * Handles the change of the search input.
 * @param {string} value The search query.
 */
export const handleSearchInputChange = (value) => {
    state.searchQuery = value;
    state.currentPage = 1;
    renderOrdersTable();
};

/**
 * Moves the table to the next page.
 */
export const goToNextPage = () => {
    if (state.currentPage < state.totalPages) {
        state.currentPage++;
        renderOrdersTable();
    }
};

/**
 * Moves the table to the previous page.
 */
export const goToPrevPage = () => {
    if (state.currentPage > 1) {
        state.currentPage--;
        renderOrdersTable();
    }
};

/**
 * Updates the autocomplete suggestions for a given input field.
 * @param {string} inputId The ID of the input field.
 * @param {string} listId The ID of the autocomplete list.
 * @param {Array<string>} suggestions The array of suggestions.
 */
export const updateAutocomplete = (inputId, listId, suggestions) => {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    list.innerHTML = '';
    list.classList.add('hidden');

    if (input.value.length < 2) return;

    const filtered = suggestions.filter(s => s.toLowerCase().includes(input.value.toLowerCase()));
    
    if (filtered.length > 0) {
        list.classList.remove('hidden');
        filtered.slice(0, 10).forEach(item => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.innerText = item;
            div.addEventListener('click', () => {
                input.value = item;
                list.classList.add('hidden');
            });
            list.appendChild(div);
        });
    }
};
