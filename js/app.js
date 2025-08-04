const apiManager = {
    async testConnection() {
        const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=test');
        const result = await response.json();
        return result.success;
    },

    async getInventory() {
        const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getInventory');
        const result = await response.json();
        return result.data; // hasil berupa objek inventaris
    },

    async recordBorrow(borrowData) {
        const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=borrow', {
            method: 'POST',
            body: JSON.stringify(borrowData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    },

    async recordReturn(returnData) {
        const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=return', {
            method: 'POST',
            body: JSON.stringify(returnData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    },

    async forceRefresh() {
        const response = await fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=refresh');
        return await response.json();
    },

    getStats() {
        return { connected: true }; // bisa ditambahkan tracking stats jika perlu
    }
};
