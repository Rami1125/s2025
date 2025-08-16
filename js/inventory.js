// js/inventory.js
// Handles the rendering of the inventory tables.

import { state } from './state.js';
import { showContainerHistory } from './modals.js';

const inUseContainersTableBody = document.getElementById('in-use-containers-table-body');
const availableContainersTableBody = document.getElementById('available-containers-table-body');
const totalContainersCountElem = document.getElementById('total-containers-count');

/**
 * Renders the in-use and available containers tables.
 */
export const renderInventoryTables = () => {
    const allContainers = getAllContainers();
    const inUseContainers = getInUseContainers();
    const availableContainers = getAvailableContainers(allContainers, inUseContainers);

    renderTable(inUseContainersTableBody, inUseContainers, createInUseRow);
    renderTable(availableContainersTableBody, availableContainers, createAvailableRow);

    totalContainersCountElem.innerText = allContainers.length;
};

/**
 * Gets all unique container numbers from the orders.
 * @returns {Array<string>} An array of unique container numbers.
 */
const getAllContainers = () => {
    const allContainers = new Set();
    state.orders.forEach(order => {
        if (order['מספרים מכולה']) {
            order['מספרים מכולה'].split(',').forEach(num => allContainers.add(num.trim()));
        }
    });
    return Array.from(allContainers).sort();
};

/**
 * Gets the containers that are currently in use.
 * @returns {Array<object>} An array of orders representing in-use containers.
 */
const getInUseContainers = () => {
    return state.orders.filter(order => order['סטטוס'] !== 'סגור' && order['פעולה'] === 'הורדה');
};

/**
 * Gets the containers that are currently available.
 * @param {Array<string>} allContainers An array of all unique containers.
 * @param {Array<object>} inUseContainers An array of orders representing in-use containers.
 * @returns {Array<object>} An array of objects representing available containers.
 */
const getAvailableContainers = (allContainers, inUseContainers) => {
    const inUseNumbers = new Set(inUseContainers.map(o => o['מספרים מכולה']).flatMap(s => s.split(',').map(n => n.trim())));
    const availableNumbers = allContainers.filter(num => !inUseNumbers.has(num));

    const availableContainers = availableNumbers.map(num => {
        const relatedOrder = state.orders.find(o => o['סטטוס'] === 'סגור' && o['מספרים מכולה'].split(',').map(n => n.trim()).includes(num));
        return {
            number: num,
            finishDate: relatedOrder ? relatedOrder['תאריך סיום'] : 'לא ידוע',
            document: relatedOrder ? relatedOrder['תעודה'] : 'לא ידוע'
        };
    });
    
    return availableContainers;
};

/**
 * Renders a table with the given data and row creation function.
 * @param {HTMLElement} tableBody The table body element.
 * @param {Array<object>} data The data to render.
 * @param {Function} createRowFunc The function to create a table row.
 */
const renderTable = (tableBody, data, createRowFunc) => {
    tableBody.innerHTML = '';
    data.forEach(item => {
        const row = createRowFunc(item);
        tableBody.appendChild(row);
    });
};

/**
 * Creates a table row for an in-use container.
 * @param {object} order The order object.
 * @returns {HTMLTableRowElement} The created table row element.
 */
const createInUseRow = (order) => {
    const row = document.createElement('tr');
    row.className = 'border-b';
    row.innerHTML = `
        <td class="py-3 px-6 whitespace-nowrap">${order['תעודה'] || ''}</td>
        <td class="py-3 px-6 whitespace-nowrap">${order['תאריך הזמנה'] || ''}</td>
        <td class="py-3 px-6 whitespace-nowrap">${order['שם לקוח'] || ''}</td>
        <td class="py-3 px-6 whitespace-nowrap">${
            order['מספרים מכולה'] ? order['מספרים מכולה'].split(',').map(num => 
                `<button class="text-primary-brand hover:underline p-0 m-0 bg-transparent border-none" onclick="showContainerHistory('${num.trim()}')">${num.trim()}</button>`
            ).join(', ') : ''
        }</td>
    `;
    return row;
};

/**
 * Creates a table row for an available container.
 * @param {object} container The container object.
 * @returns {HTMLTableRowElement} The created table row element.
 */
const createAvailableRow = (container) => {
    const row = document.createElement('tr');
    row.className = 'border-b';
    row.innerHTML = `
        <td class="py-3 px-6 whitespace-nowrap">${container.document}</td>
        <td class="py-3 px-6 whitespace-nowrap">${container.finishDate}</td>
        <td class="py-3 px-6 whitespace-nowrap">
            <button class="text-primary-brand hover:underline p-0 m-0 bg-transparent border-none" onclick="showContainerHistory('${container.number}')">${container.number}</button>
        </td>
    `;
    return row;
};
