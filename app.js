// ========== DATA MANAGEMENT ==========
let allOrders = [];
let currentPage = 1;
const rowsPerPage = isMobile ? 20 : 50;
let containerInventoryLoaded = false;
let treatmentBoardLoaded = false;

// Load initial data
async function loadInitialData() {
    showLoader();
    
    try {
        // Load orders data
        const ordersResponse = await fetchData('list');
        if (ordersResponse.success) {
            allOrders = ordersResponse.data;
            updateDashboard();
            renderPaginatedTable(allOrders);
        }
        
        // Load other initial data as needed...
    } catch (error) {
        showAlert('שגיאה בטעינת נתונים: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}

// ========== TABLE & PAGINATION ==========
function renderPaginatedTable(data) {
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedData = data.slice(start, start + rowsPerPage);
    renderOrdersTable(paginatedData);
    renderPaginationControls(data.length);
}

function renderPaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const paginationContainer = document.getElementById('pagination-controls');
    
    if (!paginationContainer) return;
    
    let html = `
        <div class="flex justify-center items-center gap-2 mt-4">
            <button onclick="changePage(1)" ${currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}">
                <i class="fas fa-angle-double-right"></i>
            </button>
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}">
                <i class="fas fa-angle-right"></i>
            </button>
            <span class="px-4">עמוד ${currentPage} מתוך ${totalPages}</span>
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}">
                <i class="fas fa-angle-left"></i>
            </button>
            <button onclick="changePage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}">
                <i class="fas fa-angle-double-left"></i>
            </button>
        </div>
    `;
    
    paginationContainer.innerHTML = html;
}

function changePage(newPage) {
    currentPage = newPage;
    filterTable();
}

// ========== SEARCH & FILTER ==========
function filterTable() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const actionFilter = document.getElementById('filter-action-type').value;
    
    const filtered = allOrders.filter(order => {
        const matchesSearch = 
            (order['שם לקוח'] || '').toLowerCase().includes(searchText) ||
            (order['תעודה'] || '').toLowerCase().includes(searchText) ||
            (order['כתובת'] || '').toLowerCase().includes(searchText) ||
            (order['מספר מכולה ירדה'] || '').toLowerCase().includes(searchText) ||
            (order['מספר מכולה עלתה'] || '').toLowerCase().includes(searchText);
            
        const matchesStatus = statusFilter === 'all' || order['סטטוס'] === statusFilter;
        const matchesAction = actionFilter === 'all' || order['סוג פעולה'] === actionFilter;
        
        return matchesSearch && matchesStatus && matchesAction;
    });
    
    renderPaginatedTable(filtered);
    highlightSearchMatches(searchText);
}

function highlightSearchMatches(searchText) {
    if (!searchText) return;
    
    document.querySelectorAll('#orders-table td').forEach(cell => {
        const text = cell.textContent;
        const regex = new RegExp(searchText, 'gi');
        cell.innerHTML = text.replace(regex, match => `<span class="highlight">${match}</span>`);
    });
}

// ========== AUTOCOMPLETE ==========
function initAutocomplete() {
    // Customer name autocomplete
    const customerNames = [...new Set(allOrders.map(o => o['שם לקוח']).filter(Boolean)];
    new Awesomplete(document.getElementById('שם לקוח'), {
        list: customerNames,
        minChars: 1,
        maxItems: 5
    });
    
    // Address autocomplete
    const addresses = [...new Set(allOrders.map(o => o['כתובת']).filter(Boolean)];
    new Awesomplete(document.getElementById('כתובת'), {
        list: addresses,
        minChars: 1,
        maxItems: 5
    });
    
    // Container number autocomplete
    const containerNumbers = [...new Set(
        allOrders.flatMap(o => [
            ...(o['מספר מכולה ירדה'] || '').split(',').map(c => c.trim()).filter(c => c),
            ...(o['מספר מכולה עלתה'] || '').split(',').map(c => c.trim()).filter(c => c)
        ])
    )];
    new Awesomplete(document.getElementById('מספר מכולה ירדה'), { list: containerNumbers });
    new Awesomplete(document.getElementById('מספר מכולה עלתה'), { list: containerNumbers });
}

// ========== DARK MODE ==========
function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadInitialData();
    
    // Initialize keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
});

// More functions would be added here...
