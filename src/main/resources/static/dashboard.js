let assetTypeChart = null;
let portfolioDistributionChart = null;
let currentStockInfo = null;

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

// Load dashboard data
async function loadDashboard() {
    try {
        await Promise.all([
            loadSummary(),
            loadHoldingsOverview(),
            loadRecentTransactions()
        ]);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load portfolio summary
async function loadSummary() {
    try {
        const response = await fetch(`${HOLDINGS_API}/summary`);
        const summary = await response.json();

        document.getElementById('totalValue').textContent = formatCurrency(summary.totalValue);
        document.getElementById('totalCost').textContent = formatCurrency(summary.totalCost);
        document.getElementById('totalProfitLoss').textContent = formatCurrency(summary.totalProfitLoss);
        document.getElementById('totalProfitLossPercentage').textContent =
            parseFloat(summary.totalProfitLossPercentage).toFixed(2) + '%';

        // Apply color to profit/loss
        const profitLossElement = document.getElementById('totalProfitLoss');
        const profitLossValue = parseFloat(summary.totalProfitLoss);

        if (profitLossValue > 0) {
            profitLossElement.style.color = '#4caf50';
        } else if (profitLossValue < 0) {
            profitLossElement.style.color = '#f44336';
        } else {
            profitLossElement.style.color = 'white';
        }

        // Update charts
        updateCharts(summary);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Load holdings overview
async function loadHoldingsOverview() {
    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();

        const grid = document.getElementById('holdingsGrid');
        grid.innerHTML = '';

        if (holdings.length === 0) {
            grid.innerHTML = '<div class="empty-state">No holdings data</div>';
            return;
        }

        // Show top 6 holdings
        holdings.slice(0, 6).forEach(holding => {
            const card = createHoldingCard(holding);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading holdings:', error);
    }
}

// Create holding card
function createHoldingCard(holding) {
    const card = document.createElement('div');
    card.className = 'holding-card';

    const profitLossClass = holding.profitLoss > 0 ? 'profit-positive' :
                           holding.profitLoss < 0 ? 'profit-negative' : 'profit-neutral';
    const badgeClass = getBadgeClass(holding.assetType);

    card.innerHTML = `
        <div class="holding-card-header">
            <div class="ticker">${holding.ticker}</div>
            <span class="badge ${badgeClass}">${getAssetTypeName(holding.assetType)}</span>
        </div>
        <div class="holding-card-body">
            <div class="holding-stat">
                <span class="stat-label">Shares</span>
                <span class="stat-value">${holding.volume}</span>
            </div>
            <div class="holding-stat">
                <span class="stat-label">Current Price</span>
                <span class="stat-value">${formatCurrency(holding.currentPrice)}</span>
            </div>
            <div class="holding-stat">
                <span class="stat-label">Total Value</span>
                <span class="stat-value">${formatCurrency(holding.totalValue)}</span>
            </div>
            <div class="holding-stat">
                <span class="stat-label">P/L</span>
                <span class="stat-value ${profitLossClass}">${formatCurrency(holding.profitLoss)}</span>
            </div>
        </div>
    `;

    return card;
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        const response = await fetch(`${TRANSACTIONS_API}/recent?days=7`);
        const transactions = await response.json();

        const list = document.getElementById('recentTransactions');
        list.innerHTML = '';

        if (transactions.length === 0) {
            list.innerHTML = '<div class="empty-state">No recent transactions</div>';
            return;
        }

        transactions.slice(0, 5).forEach(transaction => {
            const item = createTransactionItem(transaction);
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Create transaction item
function createTransactionItem(transaction) {
    const item = document.createElement('div');
    item.className = 'transaction-item';

    const typeClass = transaction.transactionType === 'BUY' ? 'transaction-buy' : 'transaction-sell';
    const typeIcon = transaction.transactionType === 'BUY' ? '📈' : '📉';
    const typeText = transaction.transactionType === 'BUY' ? 'Buy' : 'Sell';

    item.innerHTML = `
        <div class="transaction-icon ${typeClass}">
            ${typeIcon}
        </div>
        <div class="transaction-info">
            <div class="transaction-ticker">${transaction.holding?.ticker || 'N/A'}</div>
            <div class="transaction-details">
                ${typeText} ${transaction.volume} shares @ ${formatCurrency(transaction.price)}
            </div>
        </div>
        <div class="transaction-amount">
            ${formatCurrency(transaction.totalAmount)}
        </div>
    `;

    return item;
}

// Update charts
function updateCharts(summary) {
    updateAssetTypeChart(summary);
    updatePortfolioDistributionChart(summary);
}

// Update asset type chart
function updateAssetTypeChart(summary) {
    const ctx = document.getElementById('assetTypeChart').getContext('2d');

    if (assetTypeChart) {
        assetTypeChart.destroy();
    }

    assetTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Stocks', 'Bonds', 'Cash'],
            datasets: [{
                data: [summary.stockCount, summary.bondCount, summary.cashCount],
                backgroundColor: ['#667eea', '#f093fb', '#43e97b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Update portfolio distribution chart
async function updatePortfolioDistributionChart(summary) {
    const ctx = document.getElementById('portfolioDistributionChart').getContext('2d');

    if (portfolioDistributionChart) {
        portfolioDistributionChart.destroy();
    }

    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();

        const labels = holdings.map(h => h.ticker);
        const data = holdings.map(h => h.totalValue || 0);

        portfolioDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
                        '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating portfolio chart:', error);
    }
}
