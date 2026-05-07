const BASE_URL = "http://localhost:8000";

/**
 * IDENTITY LOGIC
 * Checks if this browser has a unique XOX ID.
 * If not, it generates one and saves it.
 */
export const getSystemId = () => {
    let id = localStorage.getItem('xox_user_id');
    if (!id) {
        // Generate a random but persistent ID for the user
        id = 'xox_guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('xox_user_id', id);
    }
    return id;
};

/**
 * THE API BRIDGE
 */
const xoxApi = {
    // 1. Fetch the user's private history from SQLite
    fetchHistory: async () => {
        const userId = getSystemId();
        try {
            const response = await fetch(`${BASE_URL}/history?user_id=${userId}`);
            if (!response.ok) throw new Error("Failed to fetch history");
            return await response.json();
        } catch (error) {
            console.error("API Error (fetchHistory):", error);
            return [];
        }
    },

    // 2. Send a new URL to FastAPI for scraping
    scrapeProduct: async (url, platform) => {
        const userId = getSystemId();
        try {
            // Passing parameters as query strings to match your FastAPI setup
            const response = await fetch(
                `${BASE_URL}/scrape/${platform}?url=${encodeURIComponent(url)}&user_id=${userId}`,
                { method: 'POST' }
            );
            
            const result = await response.json();
            if (result.status === "success") {
                return result.data;
            } else {
                throw new Error(result.detail || "Scraping failed");
            }
        } catch (error) {
            console.error("API Error (scrapeProduct):", error);
            throw error;
        }
    },

    // 3. Update the target price in the database
    updateTarget: async (itemId, newTarget) => {
        try {
            const response = await fetch(
                `${BASE_URL}/items/${itemId}/target?target=${newTarget}`,
                { method: 'PATCH' }
            );
            return await response.json();
        } catch (error) {
            console.error("API Error (updateTarget):", error);
            throw error;
        }
    }
};

export default xoxApi;