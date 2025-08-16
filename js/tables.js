// js/tables.js
// Handles all table rendering, filtering, sorting, and pagination logic.

import { state } from './state.js';
import { showOrderDetails, openOrderModal } from './modals.js';
import { highlightText } from './utils.js';

let currentPage = 1;
const rowsPerPage = 10;
let currentSortColumn = null;
let currentSortDirection = 'asc';

/**
 * Renders the orders table with the given data.
 * @param {Array<Object>} orders The list of orders to render.
 */
export const renderOrdersTable = (orders) => {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    // Apply filters and search
    let filteredOrders = orders;
    const searchTerm = state.filters.searchTerm.toLowerCase();
    const statusFilter = state.filters.statusFilter;
    const actionFilter = state.filters.actionFilter;

    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => 
            (order['מספר הזמנה'] && order['מספר הזמנה'].toLowerCase().includes(searchTerm)) ||
            (order['שם לקוח'] && order['שם לקוח'].toLowerCase().includes(searchTerm)) ||
            (order['מספר מסמך'] && order['מספר מסמך'].toLowerCase().includes(searchTerm)) ||
            (order['סטטוס'] && order['סטטוס'].toLowerCase().includes(searchTerm)) ||
            (order['הערות'] && order['הערות'].toLowerCase().includes(searchTerm))
        );
    }
    
    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order['סטטוס'] === statusFilter);
    }

    if (actionFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => {
            const actions = {
                'open': order.statusClass === 'status-open',
                'overdue': order.statusClass === 'status-overdue'
            };
            return actions[actionFilter];
        });
    }

    // Sort data
    if (currentSortColumn) {
        filteredOrders.sort((a, b) => {
            const aVal = a[currentSortColumn] || '';
            const bVal = b[currentSortColumn] || '';

            if (typeof aVal === 'string') {
                return currentSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }

    state.filteredOrders = filteredOrders;
    
    // Pagination
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedOrders = state.filteredOrders.slice(start, end);
    const totalPages = Math.ceil(state.filteredOrders.length / rowsPerPage);
    document.getElementById('page-info').textContent = `עמוד ${currentPage} מתוך ${totalPages}`;

    paginatedOrders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50 dark:hover:bg-gray-700';
        row.innerHTML = `
            <td class="py-2 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">${highlightText(order['מספר הזמנה'], searchTerm)}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${highlightText(order['שם לקוח'], searchTerm)}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${highlightText(order['מספר מסמך'], searchTerm)}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${highlightText(order['שם סוכן'], searchTerm)}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${highlightText(order['כתובת'], searchTerm)}</td>
            <td class="py-2 px-4 text-sm text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.statusClass}">${highlightText(order['סטטוס'], searchTerm)}</span>
            </td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${highlightText(order['תאריך יצירה'], searchTerm)}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${order['תאריך סיום צפוי'] || '-'}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${order.overdueDays > 0 ? `<span class="text-red-500">${order.overdueDays} ימים</span>` : '-'}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                <div class="flex items-center space-x-2 space-x-reverse">
                    <button onclick="showOrderDetails('${order['מספר הזמנה']}')" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300" title="צפה בפרטים">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="openOrderModal('edit', '${order['מספר הזמנה']}')" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300" title="ערוך">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="window.duplicateOrder('${order['מספר הזמנה']}')" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300" title="שכפל">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
};

/**
 * Renders the containers inventory table.
 * @param {Array<Object>} containers The list of containers to render.
 */
export const renderContainersTable = (containers) => {
    const tableBody = document.getElementById('containers-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    containers.forEach(container => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50 dark:hover:bg-gray-700';
        row.innerHTML = `
            <td class="py-2 px-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">${container['מספר מכולה']}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${container['מיקום']}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${container['סטטוס']}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${container['תאריך אחרון במלאי']}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">${container['הערות'] || '-'}</td>
            <td class="py-2 px-4 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                <div class="flex items-center space-x-2 space-x-reverse">
                    <button onclick="showContainerHistory('${container['מספר מכולה']}')" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300" title="היסטוריה">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
};

/**
 * Renders the treatment table for the Kanban board.
 * @param {Array<Object>} orders The list of orders to render.
 */
export const renderTreatmentTable = (orders) => {
    // This is part of the Kanban board, so it will handle rendering its own cards.
    // For now, it remains a placeholder.
    console.log("Rendering Kanban treatment board...");
};

/**
 * Handles table sorting.
 * @param {HTMLElement} header The table header element that was clicked.
 */
export const handleSort = (header) => {
    const column = header.dataset.sortBy;
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    document.querySelectorAll('#orders-table-header th').forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
    header.classList.add(`sorted-${currentSortDirection}`);
    renderOrdersTable(state.allOrders);
};

/**
 * Handles status filter change.
 * @param {string} status The status to filter by.
 */
export const handleStatusFilterChange = (status) => {
    state.filters.statusFilter = status;
    renderOrdersTable(state.allOrders);
};

/**
 * Handles action filter change.
 * @param {string} action The action to filter by.
 */
export const handleActionFilterChange = (action) => {
    state.filters.actionFilter = action;
    renderOrdersTable(state.allOrders);
};

/**
 * Handles search input change.
 * @param {string} term The search term.
 */
export const handleSearchInputChange = (term) => {
    state.filters.searchTerm = term;
    renderOrdersTable(state.allOrders);
};

/**
 * Goes to the next page of the orders table.
 */
export const goToNextPage = () => {
    const totalPages = Math.ceil(state.filteredOrders.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderOrdersTable(state.allOrders);
    }
};

/**
 * Goes to the previous page of the orders table.
 */
export const goToPrevPage = () => {
    if (currentPage > 1) {
        currentPage--;
        renderOrdersTable(state.allOrders);
    }
};

/**
 * Updates the autocomplete suggestions for a given input.
 * @param {string} inputId The ID of the input field.
 * @param {string} listId The ID of the datalist.
 * @param {Array<string>} suggestions The list of suggestions.
 */
export const updateAutocomplete = (inputId, listId, suggestions) => {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (!input || !list) return;

    const inputValue = input.value.toLowerCase();
    list.innerHTML = '';

    suggestions.filter(s => s && s.toLowerCase().includes(inputValue))
               .forEach(s => {
                   const option = document.createElement('option');
                   option.value = s;
                   list.appendChild(option);
               });
};
