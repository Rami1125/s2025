// js/app.js
// The main entry point for the application. Initializes all modules and listeners.

import { state } from './state.js';
import { updateAllData } from './data.js';
import { showPage, initializeTheme, toggleTheme, setupDateTimeDisplay, showLoader, hideLoader } from './ui.js'; // הוספת showLoader ו-hideLoader
import { openOrderModal, handleOrderFormSubmit, handleAddContainerFormSubmit, closeOrder, deleteOrder, duplicateOrder, addPredefinedNote, showOrderDetails, showContainerHistory, showContainersAtSites } from './modals.js';
import { handleSort, handleStatusFilterChange, handleActionFilterChange, handleSearchInputChange, goToNextPage, goToPrevPage, updateAutocomplete } from './tables.js';
import { debounce } from './utils.js';
import { toggleFullscreenChart, closeFullscreenChart } from './charts.js';
import { handleDrop } from './kanban.js';
import { isMobile } from './utils.js';

/**
 * Initializes the application.
 */
const initializeApp = () => {
    initializeTheme();
    setupDateTimeDisplay();
    setupEventListeners();
    updateAllData();
    showPage('dashboard-page');
};

/**
 * Sets up all the event listeners for the application.
 */
const setupEventListeners = () => {
    // Navigation
    document.getElementById('desktop-nav-dashboard').addEventListener('click', () => showPage('dashboard-page'));
    document.getElementById('desktop-nav-orders').addEventListener('click', () => showPage('orders-page'));
    document.getElementById('desktop-nav-inventory').addEventListener('click', () => showPage('inventory-page'));
    document.getElementById('desktop-nav-treatment').addEventListener('click', () => showPage('treatment-page'));
    
    // Mobile navigation
    document.getElementById('mobile-nav-dashboard').addEventListener('click', () => showPage('dashboard-page'));
    document.getElementById('mobile-nav-orders').addEventListener('click', () => showPage('orders-page'));
    document.getElementById('mobile-nav-inventory').addEventListener('click', () => showPage('inventory-page'));
    document.getElementById('mobile-nav-treatment').addEventListener('click', () => showPage('treatment-page'));

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Order form submission
    document.getElementById('order-form').addEventListener('submit', handleOrderFormSubmit);
    
    // Autocomplete listeners for order form
    document.getElementById('order-customer').addEventListener('input', () => updateAutocomplete('order-customer', 'customer-autocomplete-list', state.autocompleteCache.customers));
    document.getElementById('order-document').addEventListener('input', () => updateAutocomplete('order-document', 'document-autocomplete-list', state.autocompleteCache.documents));
    document.getElementById('order-agent').addEventListener('input', () => updateAutocomplete('order-agent', 'agent-autocomplete-list', state.autocompleteCache.agents));
    document.getElementById('order-address').addEventListener('input', () => updateAutocomplete('order-address', 'address-autocomplete-list', state.autocompleteCache.addresses));
    
    // Order modal actions
    document.getElementById('close-order-btn').addEventListener('click', closeOrder);
    document.getElementById('delete-order-btn').addEventListener('click', deleteOrder);
    document.getElementById('duplicate-order-btn').addEventListener('click', duplicateOrder);

    // Table filters and pagination
    document.getElementById('status-filter').addEventListener('change', (e) => handleStatusFilterChange(e.target.value));
    document.getElementById('action-filter').addEventListener('change', (e) => handleActionFilterChange(e.target.value));
    document.getElementById('search-input').addEventListener('input', debounce((e) => handleSearchInputChange(e.target.value), 300));
    document.getElementById('next-page').addEventListener('click', goToNextPage);
    document.getElementById('prev-page').addEventListener('click', goToPrevPage);

    // Table sorting
    document.getElementById('orders-table-header').addEventListener('click', (e) => {
        const header = e.target.closest('th');
        if (header && header.dataset.sortBy) {
            handleSort(header);
        }
    });

    // Chart actions
    document.getElementById('fullscreen-chart-btn').addEventListener('click', toggleFullscreenChart);
    document.getElementById('fullscreen-chart-modal').addEventListener('click', (e) => {
        if (e.target.id === 'fullscreen-chart-modal') {
            closeFullscreenChart();
        }
    });
    window.addEventListener('resize', () => {
        if (!document.body.classList.contains('chart-fullscreen-active')) {
            if (!document.getElementById('dashboard-page').classList.contains('hidden')) {
                // Redraw charts on resize to be responsive
            }
        }
    });

    // Kanban board
    document.getElementById('overdue-column').addEventListener('drop', handleDrop);
    document.getElementById('in-treatment-column').addEventListener('drop', handleDrop);
    document.getElementById('treated-column').addEventListener('drop', handleDrop);
    document.getElementById('overdue-column').addEventListener('dragover', (e) => e.preventDefault());
    document.getElementById('in-treatment-column').addEventListener('dragover', (e) => e.preventDefault());
    document.getElementById('treated-column').addEventListener('dragover', (e) => e.preventDefault());
    
    // Inventory
    document.getElementById('add-container-form').addEventListener('submit', handleAddContainerFormSubmit);
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.altKey && event.key === 'n') {
            event.preventDefault();
            openOrderModal('add');
        }
        if (event.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal-overlay.active');
            if (activeModals.length > 0) {
                activeModals[activeModals.length - 1].querySelector('.modal-close-btn')?.click();
            }
        }
    });
};

// Expose functions to the global scope for event handlers defined in HTML
window.openOrderModal = openOrderModal;
window.showOrderDetails = showOrderDetails;
window.showContainerHistory = showContainerHistory;
window.showContainersAtSites = showContainersAtSites;
window.addPredefinedNote = addPredefinedNote;
window.closeOrder = closeOrder;
window.showDeleteConfirmation = () => document.getElementById('delete-modal-overlay').classList.remove('hidden');
window.closeDeleteConfirmation = () => document.getElementById('delete-modal-overlay').classList.add('hidden');
window.deleteOrder = deleteOrder;
window.duplicateOrder = duplicateOrder;

window.onload = initializeApp;
