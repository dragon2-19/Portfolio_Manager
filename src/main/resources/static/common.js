// API URLs
const HOLDINGS_API = 'http://localhost:8080/api/holdings';
const STOCKS_API = 'http://localhost:8080/api/stocks';
const TRANSACTIONS_API = 'http://localhost:8080/api/transactions';

// Format currency
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '¥0.00';
    return '¥' + parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Format percentage
function formatPercentage(value) {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    const pct = parseFloat(value);
    const color = pct > 0 ? 'profit-positive' : pct < 0 ? 'profit-negative' : 'profit-neutral';
    return `<span class="${color}">${pct.toFixed(2)}%</span>`;
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Format datetime
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get badge class based on asset type
function getBadgeClass(assetType) {
    switch (assetType) {
        case 'STOCK':
            return 'badge-stock';
        case 'BOND':
            return 'badge-bond';
        case 'CASH':
            return 'badge-cash';
        default:
            return '';
    }
}

// Get asset type name in Chinese
function getAssetTypeName(assetType) {
    switch (assetType) {
        case 'STOCK':
            return '股票';
        case 'BOND':
            return '债券';
        case 'CASH':
            return '现金';
        default:
            return assetType;
    }
}

// Get transaction type badge
function getTransactionTypeBadge(type) {
    switch (type) {
        case 'BUY':
            return '<span class="badge badge-buy">买入</span>';
        case 'SELL':
            return '<span class="badge badge-sell">卖出</span>';
        default:
            return type;
    }
}

// Format number with commas
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// Show alert with custom styling
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
