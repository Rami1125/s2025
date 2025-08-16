// js/ui.js
// Contains UI-related functions like modals, loaders, and theme management.

import { state } from './state.js';

/**
 * Shows a specific page by adding the 'active' class and hiding others.
 * @param {string} pageId The ID of the page to show.
 */
export const showPage = (pageId) => {
    document.querySelectorAll('main > section.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
    
    // Update active state of desktop navigation links
    document.querySelectorAll('#desktop-nav a').forEach(link => {
        link.classList.remove('text-indigo-600', 'font-bold');
        link.classList.add('text-gray-600');
    });
    const activeLink = document.querySelector(`#desktop-nav a[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.remove('text-gray-600');
        activeLink.classList.add('text-indigo-600', 'font-bold');
    }

    // Update active state of mobile navigation links
    document.querySelectorAll('#mobile-nav a').forEach(link => {
        link.classList.remove('text-indigo-600');
    });
    const activeMobileLink = document.querySelector(`#mobile-nav a[data-page="${pageId}"]`);
    if (activeMobileLink) {
        activeMobileLink.classList.add('text-indigo-600');
    }
};

/**
 * Initializes the theme based on user preference or system setting.
 */
export const initializeTheme = () => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
                       (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDarkMode);
};

/**
 * Toggles the theme between light and dark mode.
 */
export const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

/**
 * Sets up a display for the current date and time.
 */
export const setupDateTimeDisplay = () => {
    const updateDateTime = () => {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        document.getElementById('current-datetime').innerText = now.toLocaleDateString('he-IL', options);
    };
    updateDateTime();
    setInterval(updateDateTime, 1000);
};

/**
 * Displays a toast notification.
 * @param {string} message The message to display.
 * @param {string} type The type of toast ('success', 'error', 'info').
 */
export const showToast = (message, type) => {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;

    // Remove all previous color classes
    toast.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500');

    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500');
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            break;
        case 'info':
            toast.classList.add('bg-blue-500');
            break;
        default:
            toast.classList.add('bg-gray-800');
            break;
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000); // Hide after 5 seconds
};

/**
 * Displays the loading overlay.
 */
export const showLoader = () => {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.classList.add('active');
    }
};

/**
 * Hides the loading overlay.
 */
export const hideLoader = () => {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.classList.remove('active');
    }
};
