// js/tables-and-charts.js
// Handles all table rendering, filtering, sorting, pagination, and data visualization.

import { highlightText, showToast } from './ui-and-utils.js';
import { isMobile } from './ui-and-utils.js';

let currentPage = 1;
const rowsPerPage = 10;
let currentSortColumn = null;
let currentSortDirection = 'asc';

/**
 * Renders the orders table with the given data.
 * @param {object} state The application state object.
 */
export const renderOrdersTable = (state) => {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    let filteredOrders = state.allOrders;
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
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedOrders = state.filteredOrders.slice(start, end);
    const totalPages = Math.ceil(state.filteredOrders.length / rowsPerPage);
    const pageInfoElement = document.getElementById('page-info');
    if (pageInfoElement) {
        pageInfoElement.textContent = `עמוד ${currentPage} מתוך ${totalPages}`;
    }

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
 * @param {object} state The application state object.
 */
export const renderContainersTable = (state) => {
    const tableBody = document.getElementById('containers-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    state.containers.forEach(container => {
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
 * @param {object} state The application state object.
 */
export const renderTreatmentTable = (state) => {
    const overdueColumn = document.getElementById('overdue-column');
    const inTreatmentColumn = document.getElementById('in-treatment-column');
    const treatedColumn = document.getElementById('treated-column');
    
    // Clear columns
    if (overdueColumn) overdueColumn.innerHTML = '';
    if (inTreatmentColumn) inTreatmentColumn.innerHTML = '';
    if (treatedColumn) treatedColumn.innerHTML = '';

    const ordersForKanban = state.allOrders.filter(order => ['חורג', 'בטיפול', 'טופל'].includes(order.status));

    ordersForKanban.forEach(order => {
        const card = document.createElement('div');
        card.className = `bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md mb-4 cursor-grab`;
        card.setAttribute('draggable', true);
        card.dataset.id = order['מספר הזמנה'];
        card.innerHTML = `
            <h4 class="font-bold text-gray-900 dark:text-gray-100">${order['מספר הזמנה']}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">לקוח: ${order['שם לקוח']}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">סטטוס: ${order['סטטוס']}</p>
        `;
        
        card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', e.target.dataset.id));

        if (order['סטטוס'] === 'חורג' && overdueColumn) {
            overdueColumn.appendChild(card);
        } else if (order['סטטוס'] === 'בטיפול' && inTreatmentColumn) {
            inTreatmentColumn.appendChild(card);
        } else if (order['סטטוס'] === 'טופל' && treatedColumn) {
            treatedColumn.appendChild(card);
        }
    });
};

/**
 * Handles table sorting.
 * @param {object} state The application state object.
 * @param {HTMLElement} header The table header element that was clicked.
 */
export const handleSort = (state, header) => {
    const column = header.dataset.sortBy;
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    document.querySelectorAll('#orders-table-header th').forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
    header.classList.add(`sorted-${currentSortDirection}`);
    renderOrdersTable(state);
};

/**
 * Handles status filter change.
 * @param {object} state The application state object.
 * @param {string} status The status to filter by.
 */
export const handleStatusFilterChange = (state, status) => {
    state.filters.statusFilter = status;
    renderOrdersTable(state);
};

/**
 * Handles action filter change.
 * @param {object} state The application state object.
 * @param {string} action The action to filter by.
 */
export const handleActionFilterChange = (state, action) => {
    state.filters.actionFilter = action;
    renderOrdersTable(state);
};

/**
 * Handles search input change.
 * @param {object} state The application state object.
 * @param {string} term The search term.
 */
export const handleSearchInputChange = (state, term) => {
    state.filters.searchTerm = term;
    renderOrdersTable(state);
};

/**
 * Goes to the next page of the orders table.
 * @param {object} state The application state object.
 */
export const goToNextPage = (state) => {
    const totalPages = Math.ceil(state.filteredOrders.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderOrdersTable(state);
    }
};

/**
 * Goes to the previous page of the orders table.
 * @param {object} state The application state object.
 */
export const goToPrevPage = (state) => {
    if (currentPage > 1) {
        currentPage--;
        renderOrdersTable(state);
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

/**
 * Draws the dashboard charts based on the provided orders data.
 * @param {object} state The application state object.
 */
export const drawDashboardCharts = (state) => {
    const orders = state.allOrders;
    
    const openOrdersCount = orders.filter(o => o['סטטוס'] === 'פתוח').length;
    const overdueOrdersCount = orders.filter(o => o['סטטוס'] === 'חורג').length;
    const availableContainersCount = state.containers.filter(c => c['סטטוס'] === 'פנוי').length;
    const totalContainersCount = state.containers.length;
    
    document.getElementById('open-orders-count').textContent = openOrdersCount;
    document.getElementById('overdue-orders-count').textContent = overdueOrdersCount;
    document.getElementById('available-containers-count').textContent = availableContainersCount;
    document.getElementById('total-containers-count').textContent = totalContainersCount;

    d3.select('#order-status-chart').html('');
    d3.select('#monthly-orders-chart').html('');
    
    const statusData = d3.rollup(orders, v => v.length, d => d['סטטוס']);
    const monthlyData = d3.rollup(orders, v => v.length, d => new Date(d['תאריך יצירה']).getMonth());

    if (!isMobile() || window.innerHeight > window.innerWidth) {
        drawPieChart(Array.from(statusData, ([key, value]) => ({ status: key, count: value })), '#order-status-chart', 'פילוח הזמנות לפי סטטוס');
        drawLineChart(Array.from(monthlyData, ([key, value]) => ({ month: key, count: value })).sort((a,b) => a.month - b.month), '#monthly-orders-chart', 'הזמנות חודשיות');
    }
};

const drawPieChart = (data, selector, title) => {
    const svg = d3.select(selector);
    const width = +svg.attr('width');
    const height = +svg.attr('height');
    const radius = Math.min(width, height) / 2;
    
    const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.status))
        .range(d3.schemeCategory10);
    
    const pie = d3.pie().value(d => d.count);
    const path = d3.arc().outerRadius(radius - 10).innerRadius(0);
    
    const arc = g.selectAll('.arc')
        .data(pie(data))
        .enter().append('g')
        .attr('class', 'arc');
    
    arc.append('path')
        .attr('d', path)
        .attr('fill', d => color(d.data.status))
        .attr('stroke', '#fff')
        .style('stroke-width', '2px');

    g.append("text")
        .attr("text-anchor", "middle")
        .attr("y", -height/2 + 20)
        .attr("fill", "var(--text-color)")
        .text(title);
};

const drawLineChart = (data, selector, title) => {
    const svg = d3.select(selector);
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = +svg.attr('width') - margin.left - margin.right;
    const height = +svg.attr('height') - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    const x = d3.scaleLinear().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    x.domain(d3.extent(data, d => d.month));
    y.domain([0, d3.max(data, d => d.count)]);

    const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.count));

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));

    g.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line)
        .attr("stroke", "var(--accent-color)")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    g.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top + 10)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--text-color)")
        .text(title);
};
