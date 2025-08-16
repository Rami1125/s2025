// js/charts.js
// Handles all charting and data visualization logic.

import { state } from './state.js';
import { isMobile } from './utils.js';

let activeChart = null;

/**
 * Draws the dashboard charts based on the provided orders data.
 * @param {Array<Object>} orders The list of orders to visualize.
 */
export const drawDashboardCharts = (orders) => {
    // Clear previous charts
    d3.select('#order-status-chart').html('');
    d3.select('#monthly-orders-chart').html('');
    
    // Aggregate data
    const statusData = d3.rollup(orders, v => v.length, d => d['סטטוס']);
    const monthlyData = d3.rollup(orders, v => v.length, d => new Date(d['תאריך יצירה']).getMonth());

    // Render charts
    if (!isMobile() || window.innerHeight > window.innerWidth) { // Render charts only on desktop or in portrait mode on mobile
        drawPieChart(Array.from(statusData, ([key, value]) => ({ status: key, count: value })), '#order-status-chart', 'פילוח הזמנות לפי סטטוס');
        drawLineChart(Array.from(monthlyData, ([key, value]) => ({ month: key, count: value })).sort((a,b) => a.month - b.month), '#monthly-orders-chart', 'הזמנות חודשיות');
    }
};

/**
 * Draws a pie chart.
 * @param {Array<Object>} data The data for the chart.
 * @param {string} selector The CSS selector for the chart container.
 * @param {string} title The title of the chart.
 */
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

/**
 * Draws a line chart.
 * @param {Array<Object>} data The data for the chart.
 * @param {string} selector The CSS selector for the chart container.
 * @param {string} title The title of the chart.
 */
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

/**
 * Toggles the fullscreen view of a chart.
 */
export const toggleFullscreenChart = () => {
    const modal = document.getElementById('fullscreen-chart-modal');
    modal.classList.toggle('active');
    document.body.classList.toggle('chart-fullscreen-active');
};

/**
 * Closes the fullscreen chart modal.
 */
export const closeFullscreenChart = () => {
    const modal = document.getElementById('fullscreen-chart-modal');
    modal.classList.remove('active');
    document.body.classList.remove('chart-fullscreen-active');
};
