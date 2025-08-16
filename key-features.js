// ========== DRAG & DROP ==========
function initDragAndDrop() {
    const tableBody = document.querySelector('#orders-table tbody');
    
    if (!tableBody) return;
    
    new Sortable(tableBody, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: function(evt) {
            // Handle reordering logic
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            const newOrder = rows.map(row => row.dataset.id);
            
            // Save new order to server
            saveNewOrder(newOrder);
        }
    });
}

// ========== INTERACTIVE CHARTS ==========
function initInteractiveCharts() {
    // Pie chart slice click handler
    document.querySelectorAll('.pie-slice').forEach(slice => {
        slice.addEventListener('click', function() {
            const status = this.dataset.status;
            filterTable(status, 'all');
        });
    });
    
    // Bar chart click handler
    document.querySelectorAll('.chart-bar').forEach(bar => {
        bar.addEventListener('click', function() {
            const customer = this.dataset.customer;
            document.getElementById('search-input').value = customer;
            filterTable();
        });
    });
}

// ========== SMART ALERTS ==========
function checkUpcomingOverdue() {
    const now = new Date();
    
    allOrders.forEach(order => {
        if (order['סטטוס'] === 'פתוח' && order['תאריך סיום צפוי']) {
            const dueDate = new Date(order['תאריך סיום צפוי']);
            const daysLeft = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysLeft <= 3 && daysLeft >= 0) {
                showAlert(`הזמנה ${order['תעודה']} תהפוך לחורגת בעוד ${daysLeft} ימים`, 'warning');
            }
        }
    });
}

// ========== LAZY LOADING ==========
async function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show current page
    const pageElement = document.getElementById(`${pageId}-page`);
    pageElement.classList.remove('hidden');
    
    // Lazy load page content if not already loaded
    if (!pageElement.dataset.loaded) {
        showLoader();
        
        try {
            await loadPageContent(pageId);
            pageElement.dataset.loaded = 'true';
            
            // Initialize page-specific features
            if (pageId === 'container-inventory') {
                initContainerInventory();
            } else if (pageId === 'treatment-board') {
                initTreatmentBoard();
            }
        } catch (error) {
            showAlert('שגיאה בטעינת תוכן הדף: ' + error.message, 'error');
        } finally {
            hideLoader();
        }
    }
}

// ========== EXPORT FUNCTIONS ==========
async function exportToExcel() {
    showLoader();
    
    try {
        const table = document.getElementById('orders-table');
        const rows = Array.from(table.querySelectorAll('tr'));
        
        if (rows.length <= 1) {
            showAlert('אין נתונים לייצוא', 'warning');
            return;
        }
        
        // Prepare CSV content
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        
        // Headers
        const headers = Array.from(rows[0].querySelectorAll('th'))
            .map(th => th.textContent.trim())
            .filter(header => header !== 'פעולות');
        csvContent += headers.join(',') + '\n';
        
        // Data rows
        for (let i = 1; i < rows.length; i++) {
            const rowData = headers.map(header => {
                const headerIndex = Array.from(rows[0].querySelectorAll('th'))
                    .findIndex(th => th.textContent.trim() === header);
                
                let value = rows[i].querySelectorAll('td')[headerIndex]?.textContent.trim() || '';
                
                // Clean up closed order formatting
                if (rows[i].classList.contains('closed-order-row')) {
                    value = value.replace(/[\u0336]/g, '');
                }
                
                // Handle commas in values
                return `"${value.replace(/"/g, '""')}"`;
            });
            
            csvContent += rowData.join(',') + '\n';
        }
        
        // Trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `הזמנות_מכולות_${new Date().toLocaleDateString('he-IL')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('הנתונים יוצאו בהצלחה', 'success');
    } catch (error) {
        showAlert('שגיאה בייצוא הנתונים: ' + error.message, 'error');
    } finally {
        hideLoader();
    }
}
