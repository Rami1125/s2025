// js/api.js
// Handles all communication with the Google Apps Script backend.

const SCRIPT_WEB_APP_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

const BACKOFF_TIME = 1000;
const MAX_RETRIES = 5;

/**
 * Fetches data from the Google Apps Script API with exponential backoff.
 * @param {object} payload The data payload to send to the API.
 * @param {number} retries The current retry attempt.
 * @returns {Promise<object>} The response data from the API.
 */
export const fetchData = async (payload, retries = 0) => {
    try {
        showLoader();
        const response = await fetch(SCRIPT_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API response was not ok, status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === 'success') {
            return data.data;
        } else if (data.status === 'too_many_requests' && retries < MAX_RETRIES) {
            console.warn(`Too many requests. Retrying in ${BACKOFF_TIME * Math.pow(2, retries)}ms...`);
            await new Promise(resolve => setTimeout(resolve, BACKOFF_TIME * Math.pow(2, retries)));
            return fetchData(payload, retries + 1);
        } else {
            throw new Error(data.message || 'API operation failed.');
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    } finally {
        hideLoader();
    }
};

/**
 * Fetches all orders from the API.
 * @returns {Promise<Array>} A promise that resolves to an array of all orders.
 */
export const fetchAllOrders = () => fetchData({ action: 'getAllOrders' });

/**
 * Adds a new order to the API.
 * @param {object} orderData The order data to add.
 * @returns {Promise<object>} A promise that resolves to the new order data.
 */
export const addOrderApi = (orderData) => fetchData({ action: 'addOrder', data: orderData });

/**
 * Updates an existing order in the API.
 * @param {string} orderId The ID of the order to update.
 * @param {object} orderData The updated order data.
 * @returns {Promise<object>} A promise that resolves to the updated order data.
 */
export const editOrderApi = (orderId, orderData) => fetchData({ action: 'editOrder', orderId, data: orderData });

/**
 * Deletes an order from the API.
 * @param {string} orderId The ID of the order to delete.
 * @returns {Promise<void>} A promise that resolves upon successful deletion.
 */
export const deleteOrderApi = (orderId) => fetchData({ action: 'deleteOrder', orderId });

/**
 * Closes an order in the API.
 * @param {string} orderId The ID of the order to close.
 * @param {object} closeData The close data.
 * @returns {Promise<object>} A promise that resolves to the closed order data.
 */
export const closeOrderApi = (orderId, closeData) => fetchData({ action: 'closeOrder', orderId, data: closeData });

/**
 * Updates the status of a kanban card in the API.
 * @param {string} orderId The ID of the order to update.
 * @param {string} newStatus The new status.
 * @returns {Promise<object>} A promise that resolves to the updated order data.
 */
export const updateKanbanStatusApi = (orderId, newStatus) => fetchData({ action: 'updateKanbanStatus', orderId, newStatus });

/**
 * Adds a new container to the API.
 * @param {string} containerNumber The new container number.
 * @returns {Promise<object>} A promise that resolves to the added container data.
 */
export const addNewContainerApi = (containerNumber) => fetchData({ action: 'addNewContainer', containerNumber });

/**
 * Fetches the history of a specific container from the API.
 * @param {string} containerNumber The container number to fetch history for.
 * @returns {Promise<Array>} A promise that resolves to an array of history entries.
 */
export const fetchContainerHistoryApi = (containerNumber) => fetchData({ action: 'getContainerHistory', containerNumber });
