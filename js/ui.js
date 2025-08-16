// js/ui.js
// Manages general UI interactions, like showing pages, modals, loaders and toasts.

import { state } from './state.js';
import { updateDateTime } from './utils.js';

const showLoader = () => { document.body.classList.add('loading'); };
const hideLoader = () => { document.body.classList.remove('loading'); };

/**
 * Shows a specific page and hides all others.
 * @param {string} pageId The ID of the page to show (e.g., 'dashboard-page').
 */
export const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');

    // Update page title
    const pageTitles = {
        'dashboard-page': 'לוח מחוונים',
        'orders-page': 'טבלת הזמנות',
        'inventory-page': 'מלאי מכולות',
        'treatment-page': 'לוח טיפול'
    };
    document.getElementById('page-title').innerText = pageTitles[pageId] || 'מערכת CRM';

    // Update active nav link
    const desktopNavLinks = document.querySelectorAll('#desktop-nav a, #desktop-nav button');
    desktopNavLinks.forEach(link => link.classList.remove('active-link'));
    const activeLink = document.querySelector(`#desktop-nav-${pageId.replace('-page', '')}`);
    if (activeLink) {
        activeLink.classList.add('active-link');
    }
};

/**
 * Displays a toast notification.
 * @param {string} message The message to display.
 * @param {string} type The type of the toast ('success', 'error', 'warning', 'info').
 * @param {number} duration The duration in milliseconds.
 */
export const showAlert = (message, type = 'success', duration = 3000) => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type} active`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas text-xl ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-times-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
            }"></i>
            <span class="text-sm font-medium">${message}</span>
        </div>
    `;
    toastContainer.prepend(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, duration);
};

/**
 * Initializes the theme based on local storage or system preference.
 */
export const initializeTheme = () => {
    const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);
};

/**
 * Toggles between light and dark themes.
 */
export const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
};

/**
 * Updates the theme toggle icon.
 * @param {string} theme The current theme ('light' or 'dark').
 */
const updateThemeIcons = (theme) => {
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }
};

/**
 * Displays the current date and time.
 */
export const setupDateTimeDisplay = () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
};

// Expose loader functions
export { showLoader, hideLoader };
