// Make functions globally accessible (ensure they work with onclick)
window.testConnection = testConnection;
window.openCashDepositModal = openCashDepositModal;
window.openCashWithdrawModal = openCashWithdrawModal;
window.openBuyModal = openBuyModal;
window.openSellModal = openSellModal;
window.loadHoldings = loadHoldings;
window.depositCash = depositCash;
window.withdrawCash = withdrawCash;
window.buyStock = buyStock;
window.sellStock = sellStock;
window.quickSell = quickSell;
window.deleteHolding = deleteHolding;
window.closeCashDepositModal = closeCashDepositModal;
window.closeCashWithdrawModal = closeCashWithdrawModal;
window.closeBuyModal = closeBuyModal;
window.closeSellModal = closeSellModal;
window.updateBuyPrice = updateBuyPrice;
window.updateSellPrice = updateSellPrice;
window.updateBuyTotal = updateBuyTotal;
window.updateSellProfit = updateSellProfit;

console.log('holdings.js loaded - functions exported to window');

// Load holdings on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    loadHoldings();
    loadCashBalance();
    setupBuyModalListeners();
    setupSellModalListeners();
    console.log('All listeners setup complete');
});

// Load all holdings
async function loadHoldings() {
    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();
        displayHoldings(holdings);
        updateStats(holdings);
    } catch (error) {
        console.error('Error loading holdings:', error);
        alert('Failed to load data, please check if the backend service is running');
    }
}

// Load summary
async function loadSummary() {
    try {
        const response = await fetch(`${HOLDINGS_API}/summary`);
        const summary = await response.json();
        // Update stats if needed
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Display holdings in table
function displayHoldings(holdings) {
    const tbody = document.getElementById('holdingsTableBody');
    tbody.innerHTML = '';

    if (holdings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">No data</td></tr>';
        return;
    }

    holdings.forEach(holding => {
        const badgeClass = getBadgeClass(holding.assetType);
        const profitLossClass = holding.profitLoss > 0 ? 'profit-positive' :
                               holding.profitLoss < 0 ? 'profit-negative' : 'profit-neutral';

        // Cash doesn't show certain operations
        const isCash = holding.assetType === 'CASH';
        const actions = isCash ?
            `<button class="action-btn btn-price" onclick="openCashWithdrawModal()">Withdraw</button>` :
            `<button class="action-btn btn-sell" onclick="quickSell('${holding.ticker}')">Sell</button>
             <button class="action-btn btn-delete" onclick="deleteHolding(${holding.id})">Delete</button>`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${holding.id}</td>
            <td><strong>${holding.ticker}</strong></td>
            <td>${holding.stockName || '-'}</td>
            <td><span class="badge ${badgeClass}">${getAssetTypeName(holding.assetType)}</span></td>
            <td>${holding.volume}</td>
            <td>${formatCurrency(holding.purchasePrice)}</td>
            <td>${formatCurrency(holding.currentPrice)}</td>
            <td>${formatCurrency(holding.totalValue)}</td>
            <td class="${profitLossClass}">${formatCurrency(holding.profitLoss)}</td>
            <td>${formatPercentage(holding.profitLossPercentage)}</td>
            <td>${formatDate(holding.purchaseDate)}</td>
            <td>
                ${actions}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats(holdings) {
    document.getElementById('totalCount').textContent = holdings.length;

    const stockCount = holdings.filter(h => h.assetType === 'STOCK').length;
    const bondCount = holdings.filter(h => h.assetType === 'BOND').length;
    const cashCount = holdings.filter(h => h.assetType === 'CASH').length;

    document.getElementById('stockCount').textContent = stockCount;
    document.getElementById('bondCount').textContent = bondCount;
    document.getElementById('cashCount').textContent = cashCount;
}

// Load cash balance
async function loadCashBalance() {
    try {
        const response = await fetch(`${HOLDINGS_API}/cash/balance`);
        const balance = await response.json();
        // Update the cash balance displayed in the interface (can be added to the page)
        return balance;
    } catch (error) {
        console.error('Error loading cash balance:', error);
        return 0;
    }
}

// Test API connection
async function testConnection() {
    try {
        console.log('Testing API connection...');
        console.log('HOLDINGS_API:', HOLDINGS_API);
        console.log('STOCKS_API:', STOCKS_API);

        const response = await fetch(HOLDINGS_API);
        if (response.ok) {
            const holdings = await response.json();
            console.log('Connection successful! Holdings:', holdings);
            alert('✅ Backend connection successful!\n\nCurrent holdings count: ' + holdings.length);
        } else {
            console.error('Connection failed with status:', response.status);
            alert('❌ Backend connection failed!\n\nStatus code: ' + response.status + '\n\nPlease ensure the backend service is running (port 8080)');
        }
    } catch (error) {
        console.error('Connection error:', error);
        alert('❌ Unable to connect to backend service!\n\nError message: ' + error.message + '\n\nPlease ensure:\n1. Backend service is running (port 8080)\n2. No firewall blocking connection\n3. Backend service is running normally');
    }
}

// Cash deposit modal
async function openCashDepositModal() {
    console.log('openCashDepositModal called');
    try {
        document.getElementById('cashDepositForm').reset();
        document.getElementById('cashDepositModal').style.display = 'block';
        console.log('cashDepositModal opened successfully');
    } catch (error) {
        console.error('Error opening cashDepositModal:', error);
        alert('Failed to open deposit window: ' + error.message);
    }
}

// Cash withdraw modal
async function openCashWithdrawModal() {
    console.log('openCashWithdrawModal called');
    try {
        const balance = await loadCashBalance();
        document.getElementById('currentCashBalance').textContent = formatCurrency(balance);
        document.getElementById('withdrawAmount').value = '';
        document.getElementById('cashWithdrawModal').style.display = 'block';
        console.log('cashWithdrawModal opened successfully');
    } catch (error) {
        console.error('Error opening cashWithdrawModal:', error);
        alert('Failed to open withdraw window: ' + error.message);
    }
}

// Deposit cash
async function depositCash(event) {
    event.preventDefault();
    console.log('depositCash called');

    const amount = parseFloat(document.getElementById('depositAmount').value);
    console.log('Deposit amount:', amount);

    try {
        const response = await fetch(`${HOLDINGS_API}/cash/deposit?amount=${amount}`, {
            method: 'POST'
        });

        console.log('Deposit response status:', response.status);

        if (response.ok) {
            closeCashDepositModal();
            loadHoldings();
            loadCashBalance();
            alert('Deposit successful!');
        } else {
            const errorText = await response.text();
            console.error('Deposit failed:', errorText);
            alert('Deposit failed: ' + errorText);
        }
    } catch (error) {
        console.error('Error depositing cash:', error);
        alert('Deposit failed, please check network connection');
    }
}

// Withdraw cash
async function withdrawCash(event) {
    event.preventDefault();
    console.log('withdrawCash called');

    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    console.log('Withdraw amount:', amount);

    try {
        const response = await fetch(`${HOLDINGS_API}/cash/withdraw?amount=${amount}`, {
            method: 'POST'
        });

        console.log('Withdraw response status:', response.status);

        if (response.ok) {
            closeCashWithdrawModal();
            loadHoldings();
            loadCashBalance();
            alert('Withdraw successful!');
        } else {
            const errorText = await response.text();
            console.error('Withdraw failed:', errorText);
            alert('Withdraw failed: ' + errorText);
        }
    } catch (error) {
        console.error('Error withdrawing cash:', error);
        alert('Withdraw failed, please check network connection');
    }
}

// Update buy price based on ticker and date
async function updateBuyPrice() {
    const ticker = document.getElementById('buyTicker').value.trim();
    const date = document.getElementById('buyDate').value;
    const priceInfo = document.getElementById('buyPriceInfo');

    if (!ticker) return;

    try {
        let price;
        if (date) {
            // Fetch historical price from API
            const response = await fetch(`${STOCKS_API}/${ticker}/historical-open?date=${date}`);
            if (response.ok) {
                const data = await response.json();
                price = data.price;
                priceInfo.textContent = `Using ${date} open price`;
            } else {
                priceInfo.textContent = 'Unable to fetch historical price';
                document.getElementById('buyOpenPrice').value = '';
                return;
            }
        } else {
            // Fetch today's open price
            const response = await fetch(`${STOCKS_API}/${ticker}`);
            if (response.ok) {
                const stockInfo = await response.json();
                price = stockInfo.open;
                priceInfo.textContent = "Today's open price";
            } else {
                priceInfo.textContent = 'Unable to fetch price';
                document.getElementById('buyOpenPrice').value = '';
                return;
            }
        }

        document.getElementById('buyOpenPrice').value = price || '';
        updateBuyTotal();
    } catch (error) {
        console.error('Error fetching stock price:', error);
        priceInfo.textContent = 'Error fetching price';
        document.getElementById('buyOpenPrice').value = '';
    }
}

// Setup buy modal listeners (called once on page load)
function setupBuyModalListeners() {
    console.log('Setting up buy modal listeners');
    try {
        // Listen to volume input
        const volumeInput = document.getElementById('buyVolume');
        if (volumeInput) {
            volumeInput.addEventListener('input', updateBuyTotal);
        }
        console.log('Buy modal listeners setup complete');
    } catch (error) {
        console.error('Error setting up buy modal listeners:', error);
    }
}

// Buy stock modal
async function openBuyModal() {
    console.log('openBuyModal called');
    try {
        document.getElementById('buyForm').reset();
        document.getElementById('buyTotalAmount').textContent = '¥0.00';
        document.getElementById('buyModal').style.display = 'block';
        console.log('buyModal opened successfully');
    } catch (error) {
        console.error('Error opening buyModal:', error);
        alert('Failed to open buy window: ' + error.message);
    }
}

// Update buy total amount
function updateBuyTotal() {
    const price = parseFloat(document.getElementById('buyOpenPrice').value) || 0;
    const volume = parseInt(document.getElementById('buyVolume').value) || 0;
    const total = price * volume * 1.0002; // Add fee 0.02%
    document.getElementById('buyTotalAmount').textContent = formatCurrency(total);
}

// Buy stock
async function buyStock(event) {
    event.preventDefault();
    console.log('buyStock called');

    const ticker = document.getElementById('buyTicker').value.trim();
    const volume = parseInt(document.getElementById('buyVolume').value);
    const purchaseDate = document.getElementById('buyDate').value || '';
    console.log('Buy ticker:', ticker, 'volume:', volume, 'date:', purchaseDate);

    try {
        let url = `${HOLDINGS_API}/buy?ticker=${encodeURIComponent(ticker)}&volume=${volume}`;
        if (purchaseDate) {
            url += `&purchaseDate=${encodeURIComponent(purchaseDate)}`;
        }

        const response = await fetch(url, {
            method: 'POST'
        });

        console.log('Buy response status:', response.status);

        if (response.ok) {
            closeBuyModal();
            loadHoldings();
            loadCashBalance();
            alert('Buy successful!');
        } else {
            const errorText = await response.text();
            console.error('Buy failed:', errorText);
            alert('Buy failed: ' + errorText);
        }
    } catch (error) {
        console.error('Error buying stock:', error);
        alert('Buy failed, please check network connection');
    }
}

// Update sell price based on ticker and date
async function updateSellPrice() {
    const ticker = document.getElementById('sellTicker').value.trim();
    const date = document.getElementById('sellDate').value;
    const priceInfo = document.getElementById('sellPriceInfo');

    if (!ticker) return;

    try {
        let price;
        if (date) {
            // Fetch historical price from API
            const response = await fetch(`${STOCKS_API}/${ticker}/historical-open?date=${date}`);
            if (response.ok) {
                const data = await response.json();
                price = data.price;
                priceInfo.textContent = `Using ${date} open price`;
            } else {
                priceInfo.textContent = 'Unable to fetch historical price';
                document.getElementById('sellOpenPrice').value = '';
                return;
            }
        } else {
            // Fetch today's open price
            const response = await fetch(`${STOCKS_API}/${ticker}`);
            if (response.ok) {
                const stockInfo = await response.json();
                price = stockInfo.open;
                priceInfo.textContent = "Today's open price";
            } else {
                priceInfo.textContent = 'Unable to fetch price';
                document.getElementById('sellOpenPrice').value = '';
                return;
            }
        }

        document.getElementById('sellOpenPrice').value = price || '';
        updateSellProfit();
    } catch (error) {
        console.error('Error fetching stock price:', error);
        priceInfo.textContent = 'Error fetching price';
        document.getElementById('sellOpenPrice').value = '';
    }
}

// Setup sell modal listeners (called once on page load)
function setupSellModalListeners() {
    console.log('Setting up sell modal listeners');
    try {
        // Listen to volume input
        const volumeInput = document.getElementById('sellVolume');
        if (volumeInput) {
            volumeInput.addEventListener('input', updateSellProfit);
        }
        console.log('Sell modal listeners setup complete');
    } catch (error) {
        console.error('Error setting up sell modal listeners:', error);
    }
}

// Sell stock modal
async function openSellModal() {
    console.log('openSellModal called');
    try {
        document.getElementById('sellForm').reset();
        document.getElementById('sellProfit').textContent = '¥0.00';
        document.getElementById('sellModal').style.display = 'block';
        console.log('sellModal opened successfully');
    } catch (error) {
        console.error('Error opening sellModal:', error);
        alert('Failed to open sell window: ' + error.message);
    }
}

// Update sell profit
function updateSellProfit() {
    const price = parseFloat(document.getElementById('sellOpenPrice').value) || 0;
    const volume = parseInt(document.getElementById('sellVolume').value) || 0;
    const sellAmount = price * volume * 0.9993; // Deduct fee 0.07%
    document.getElementById('sellProfit').textContent = formatCurrency(sellAmount);
}

// Sell stock
async function sellStock(event) {
    event.preventDefault();
    console.log('sellStock called');

    const ticker = document.getElementById('sellTicker').value.trim();
    const volume = parseInt(document.getElementById('sellVolume').value);
    const sellDate = document.getElementById('sellDate').value || '';
    console.log('Sell ticker:', ticker, 'volume:', volume, 'date:', sellDate);

    try {
        let url = `${HOLDINGS_API}/sell?ticker=${encodeURIComponent(ticker)}&volume=${volume}`;
        if (sellDate) {
            url += `&sellDate=${encodeURIComponent(sellDate)}`;
        }

        const response = await fetch(url, {
            method: 'POST'
        });

        console.log('Sell response status:', response.status);

        if (response.ok) {
            closeSellModal();
            loadHoldings();
            loadCashBalance();
            alert('Sell successful!');
        } else {
            const errorText = await response.text();
            console.error('Sell failed:', errorText);
            alert('Sell failed: ' + errorText);
        }
    } catch (error) {
        console.error('Error selling stock:', error);
        alert('Sell failed, please check network connection');
    }
}

// Quick sell from table
function quickSell(ticker) {
    openSellModal();
    document.getElementById('sellTicker').value = ticker;
}

// Delete holding
async function deleteHolding(id) {
    if (!confirm('Are you sure you want to delete this holding?\n\nNote: Deleting a holding will also delete all transaction records for this holding. This operation cannot be undone!')) {
        return;
    }

    try {
        const response = await fetch(`${HOLDINGS_API}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadHoldings();
            alert('✅ Delete successful!\n\nHolding and its related transaction records have been deleted');
        } else {
            const errorText = await response.text();
            alert('❌ Delete failed: ' + errorText);
        }
    } catch (error) {
        console.error('Error deleting holding:', error);
        alert('❌ Delete failed, please check network connection');
    }
}

// Close modals
function closeCashDepositModal() {
    document.getElementById('cashDepositModal').style.display = 'none';
}

function closeCashWithdrawModal() {
    document.getElementById('cashWithdrawModal').style.display = 'none';
}

function closeBuyModal() {
    document.getElementById('buyModal').style.display = 'none';
}

function closeSellModal() {
    document.getElementById('sellModal').style.display = 'none';
}
