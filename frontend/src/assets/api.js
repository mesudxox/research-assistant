const BASE_URL = "http://localhost:8000";

export const getSystemId = () => {
    let id = localStorage.getItem('xox_user_id');
    if (!id) {
        id = 'xox_guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('xox_user_id', id);
    }
    return id;
};


const xoxApi = {
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

    scrapeProduct: async (url, platform) => {
        const userId = getSystemId();
        try {
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
    
   deleteProduct: async (productId) => {
    // Adding ?t= ensures the browser sees a unique URL and skips the cache
    const response = await fetch(`http://localhost:8000/products/${productId}?t=${Date.now()}`, {
        method: 'DELETE', 
        headers: { 
            'Content-Type': 'application/json',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        },
    });
    
    if (!response.ok) throw new Error('Failed to delete');
    return response.json();
},

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