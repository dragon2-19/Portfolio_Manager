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
        alert('加载数据失败，请检查后端服务是否启动');
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
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">暂无数据</td></tr>';
        return;
    }

    holdings.forEach(holding => {
        const badgeClass = getBadgeClass(holding.assetType);
        const profitLossClass = holding.profitLoss > 0 ? 'profit-positive' :
                               holding.profitLoss < 0 ? 'profit-negative' : 'profit-neutral';

        // 现金不显示某些操作
        const isCash = holding.assetType === 'CASH';
        const actions = isCash ?
            `<button class="action-btn btn-price" onclick="openCashWithdrawModal()">提取</button>` :
            `<button class="action-btn btn-sell" onclick="quickSell('${holding.ticker}')">卖出</button>
             <button class="action-btn btn-delete" onclick="deleteHolding(${holding.id})">删除</button>`;

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
        // 更新界面显示的现金余额（可以添加到页面）
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
            alert('✅ 后端连接成功！\n\n当前持仓数量: ' + holdings.length);
        } else {
            console.error('Connection failed with status:', response.status);
            alert('❌ 后端连接失败！\n\n状态码: ' + response.status + '\n\n请确保后端服务已启动（端口8080）');
        }
    } catch (error) {
        console.error('Connection error:', error);
        alert('❌ 无法连接到后端服务！\n\n错误信息: ' + error.message + '\n\n请确保：\n1. 后端服务已启动（端口8080）\n2. 没有防火墙阻止连接\n3. 后端服务正常运行');
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
        alert('打开充值窗口失败：' + error.message);
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
        alert('打开提取窗口失败：' + error.message);
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
            alert('充值成功！');
        } else {
            const errorText = await response.text();
            console.error('Deposit failed:', errorText);
            alert('充值失败：' + errorText);
        }
    } catch (error) {
        console.error('Error depositing cash:', error);
        alert('充值失败，请检查网络连接');
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
            alert('提取成功！');
        } else {
            const errorText = await response.text();
            console.error('Withdraw failed:', errorText);
            alert('提取失败：' + errorText);
        }
    } catch (error) {
        console.error('Error withdrawing cash:', error);
        alert('提取失败，请检查网络连接');
    }
}

// Setup buy modal listeners (called once on page load)
function setupBuyModalListeners() {
    console.log('Setting up buy modal listeners');
    try {
        // 监听股票代码输入，自动获取开盘价
        const tickerInput = document.getElementById('buyTicker');
        if (tickerInput) {
            tickerInput.addEventListener('input', async function() {
                const ticker = this.value.trim();
                if (ticker.length === 6) {
                    try {
                        const volume = parseInt(document.getElementById('buyVolume').value) || 1;
                        // 获取股票信息（包含开盘价）
                        const response = await fetch(`${STOCKS_API}/${ticker}`);
                        const stockInfo = await response.json();
                        document.getElementById('buyOpenPrice').value = stockInfo.open || 0;
                        updateBuyTotalAmount();
                    } catch (error) {
                        console.error('Error fetching stock info:', error);
                    }
                }
            });

            // 监听数量输入
            const volumeInput = document.getElementById('buyVolume');
            if (volumeInput) {
                volumeInput.addEventListener('input', updateBuyTotalAmount);
            }
            console.log('Buy modal listeners setup complete');
        } else {
            console.error('buyTicker element not found');
        }
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
        alert('打开买入窗口失败：' + error.message);
    }
}

// Update buy total amount
function updateBuyTotalAmount() {
    const price = parseFloat(document.getElementById('buyOpenPrice').value) || 0;
    const volume = parseInt(document.getElementById('buyVolume').value) || 0;
    const total = price * volume * 1.0002; // 加上手续费 0.02%
    document.getElementById('buyTotalAmount').textContent = formatCurrency(total);
}

// Buy stock
async function buyStock(event) {
    event.preventDefault();
    console.log('buyStock called');

    const ticker = document.getElementById('buyTicker').value.trim();
    const volume = parseInt(document.getElementById('buyVolume').value);
    console.log('Buy ticker:', ticker, 'volume:', volume);

    try {
        const response = await fetch(`${HOLDINGS_API}/buy?ticker=${ticker}&volume=${volume}`, {
            method: 'POST'
        });

        console.log('Buy response status:', response.status);

        if (response.ok) {
            closeBuyModal();
            loadHoldings();
            loadCashBalance();
            alert('买入成功！');
        } else {
            const errorText = await response.text();
            console.error('Buy failed:', errorText);
            alert('买入失败：' + errorText);
        }
    } catch (error) {
        console.error('Error buying stock:', error);
        alert('买入失败，请检查网络连接');
    }
}

// Setup sell modal listeners (called once on page load)
function setupSellModalListeners() {
    console.log('Setting up sell modal listeners');
    try {
        // 监听股票代码输入
        const tickerInput = document.getElementById('sellTicker');
        if (tickerInput) {
            tickerInput.addEventListener('input', async function() {
                const ticker = this.value.trim();
                if (ticker.length === 6) {
                    try {
                        const volume = parseInt(document.getElementById('sellVolume').value) || 1;
                        const response = await fetch(`${STOCKS_API}/${ticker}`);
                        const stockInfo = await response.json();
                        document.getElementById('sellOpenPrice').value = stockInfo.open || 0;
                        updateSellProfit();
                    } catch (error) {
                        console.error('Error fetching stock info:', error);
                    }
                }
            });

            // 监听数量输入
            const volumeInput = document.getElementById('sellVolume');
            if (volumeInput) {
                volumeInput.addEventListener('input', updateSellProfit);
            }
            console.log('Sell modal listeners setup complete');
        } else {
            console.error('sellTicker element not found');
        }
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
        alert('打开卖出窗口失败：' + error.message);
    }
}

// Update sell profit
function updateSellProfit() {
    const price = parseFloat(document.getElementById('sellOpenPrice').value) || 0;
    const volume = parseInt(document.getElementById('sellVolume').value) || 0;
    const sellAmount = price * volume * 0.9993; // 减去手续费 0.07%
    document.getElementById('sellProfit').textContent = formatCurrency(sellAmount);
}

// Sell stock
async function sellStock(event) {
    event.preventDefault();
    console.log('sellStock called');

    const ticker = document.getElementById('sellTicker').value.trim();
    const volume = parseInt(document.getElementById('sellVolume').value);
    console.log('Sell ticker:', ticker, 'volume:', volume);

    try {
        const response = await fetch(`${HOLDINGS_API}/sell?ticker=${ticker}&volume=${volume}`, {
            method: 'POST'
        });

        console.log('Sell response status:', response.status);

        if (response.ok) {
            closeSellModal();
            loadHoldings();
            loadCashBalance();
            alert('卖出成功！');
        } else {
            const errorText = await response.text();
            console.error('Sell failed:', errorText);
            alert('卖出失败：' + errorText);
        }
    } catch (error) {
        console.error('Error selling stock:', error);
        alert('卖出失败，请检查网络连接');
    }
}

// Quick sell from table
function quickSell(ticker) {
    openSellModal();
    document.getElementById('sellTicker').value = ticker;
}

// Delete holding
async function deleteHolding(id) {
    if (!confirm('确定要删除该持仓吗？\n\n注意：删除持仓将同时删除该持仓的所有交易记录，此操作不可恢复！')) {
        return;
    }

    try {
        const response = await fetch(`${HOLDINGS_API}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadHoldings();
            alert('✅ 删除成功！\n\n持仓及其相关交易记录已被删除');
        } else {
            const errorText = await response.text();
            alert('❌ 删除失败：' + errorText);
        }
    } catch (error) {
        console.error('Error deleting holding:', error);
        alert('❌ 删除失败，请检查网络连接');
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
