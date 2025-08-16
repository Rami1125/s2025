// js/charts.js
// Handles all D3.js chart rendering and logic.

const containersByCustomerChart = document.getElementById('containers-by-customer-chart');
const statusPieChart = document.getElementById('status-pie-chart');
const fullscreenChartModal = document.getElementById('fullscreen-chart-modal');
const fullscreenChartContent = document.getElementById('fullscreen-chart-content');

/**
 * Draws all the charts on the dashboard.
 * @param {Array<object>} orders The array of order data.
 */
export const drawCharts = (orders) => {
    drawContainersByCustomerChart(orders);
    drawStatusPieChart(orders);
};

/**
 * Draws the "Containers by Customer" bar chart.
 * @param {Array<object>} orders The array of order data.
 */
const drawContainersByCustomerChart = (orders) => {
    // Implement D3.js bar chart drawing logic here
    containersByCustomerChart.innerHTML = ''; // Clear previous chart
};

/**
 * Draws the "Orders by Status" pie chart.
 * @param {Array<object>} orders The array of order data.
 */
const drawStatusPieChart = (orders) => {
    // Implement D3.js pie chart drawing logic here
    statusPieChart.innerHTML = ''; // Clear previous chart
};

/**
 * Toggles the "Containers by Customer" chart to fullscreen mode.
 */
export const toggleFullscreenChart = () => {
    const isFullscreen = document.body.classList.contains('chart-fullscreen-active');
    if (isFullscreen) {
        closeFullscreenChart();
    } else {
        const chartClone = containersByCustomerChart.cloneNode(true);
        chartClone.id = 'fullscreen-chart';
        fullscreenChartContent.innerHTML = '';
        fullscreenChartContent.appendChild(chartClone);
        fullscreenChartModal.classList.remove('hidden');
        document.body.classList.add('chart-fullscreen-active');
        // Redraw chart on fullscreen to adapt to new size
        drawContainersByCustomerChart(state.orders);
    }
};

/**
 * Closes the fullscreen chart modal.
 */
export const closeFullscreenChart = () => {
    fullscreenChartModal.classList.add('hidden');
    document.body.classList.remove('chart-fullscreen-active');
    // Redraw the original chart
    drawContainersByCustomerChart(state.orders);
};
