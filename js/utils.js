// js/utils.js
// Contains a collection of utility functions.

/**
 * Formats a date string to a readable format (YYYY-MM-DD).
 * @param {string} dateString The date string to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Calculates the number of days an order is overdue.
 * @param {object} order The order object.
 * @returns {number} The number of overdue days.
 */
export const calculateOverdueDays = (order) => {
    if (order['סטטוס'] !== 'חורג' || !order['תאריך סיום צפוי']) {
        return 0;
    }
    const today = new Date();
    const expectedEndDate = new Date(order['תאריך סיום צפוי']);
    const diffTime = today - expectedEndDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
};

/**
 * Checks if the current device is a mobile device.
 * @returns {boolean} True if it is a mobile device, false otherwise.
 */
export const isMobile = () => window.innerWidth < 768;

/**
 * Updates the current date and time displayed on the page.
 */
export const updateDateTime = () => {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('current-datetime').innerText = now.toLocaleDateString('he-IL', options);
};

/**
 * Highlights a substring within a text.
 * @param {string} text The original text.
 * @param {string} highlight The substring to highlight.
 * @returns {string} The HTML string with highlighted text.
 */
export const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-500 rounded px-1">$1</span>');
};

/**
 * Simple debounce function.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};
