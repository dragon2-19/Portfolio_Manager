let priceChart = null;
let currentStock = null;
let currentRange = '1mo';

// Handle search key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchStock();
    }
}

// Quick search
function quickSearch(ticker) {
    document.getElementById('searchInput').value = ticker;
    searchStock();
}

// Search stock
async function searchStock() {
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        alert('请输入股票代码或名称');
        return;
    }

    try {
        // 先尝试搜索
        const searchResponse = await fetch(`${STOCKS_API}/search?query=${encodeURIComponent(query)}`);
        const searchResults = await searchResponse.json();

        if (searchResults && searchResults.length > 0) {
            // 如果有搜索结果，显示第一个结果
            const ticker = searchResults[0].ticker;
            const response = await fetch(`${STOCKS_API}/${ticker}`);
            const stockInfo = await response.json();

            displayStockDetails(stockInfo);

            // 如果有多个搜索结果，显示搜索结果列表
            if (searchResults.length > 1) {
                displaySearchResults(searchResults);
            }
        } else {
            // 如果没有搜索结果，直接查询股票代码
            const ticker = query.toUpperCase();
            const response = await fetch(`${STOCKS_API}/${ticker}`);
            const stockInfo = await response.json();

            if (stockInfo && stockInfo.currentPrice > 0) {
                displayStockDetails(stockInfo);
            } else {
                alert('未找到匹配的股票，请检查输入');
            }
        }
    } catch (error) {
        console.error('Error searching stock:', error);
        alert('搜索失败，请检查网络连接');
    }
}

// Display search results
function displaySearchResults(results) {
    const searchResultsDiv = document.getElementById('searchResults');
    const searchResultsList = document.getElementById('searchResultsList');

    searchResultsList.innerHTML = '';

    results.forEach(stock => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <div class="result-ticker">${stock.ticker}</div>
            <div class="result-name">${stock.name}</div>
            <div class="result-price">${formatCurrency(stock.currentPrice)}</div>
        `;
        resultItem.onclick = () => displayStockDetails(stock);
        searchResultsList.appendChild(resultItem);
    });

    searchResultsDiv.style.display = 'block';
}

// Display stock details
async function displayStockDetails(stockInfo) {
    currentStock = stockInfo;

    // Update stock info
    document.getElementById('stockName').textContent = stockInfo.name || stockInfo.ticker;
    document.getElementById('stockTicker').textContent = stockInfo.ticker;
    document.getElementById('currentPrice').textContent = formatCurrency(stockInfo.currentPrice);

    // Update price change
    const changeClass = stockInfo.change > 0 ? 'profit-positive' :
                       stockInfo.change < 0 ? 'profit-negative' : 'profit-neutral';
    const changeIcon = stockInfo.change > 0 ? '↑' : stockInfo.change < 0 ? '↓' : '→';
    document.getElementById('priceChange').className = `price-change ${changeClass}`;
    document.getElementById('priceChange').textContent =
        `${changeIcon} ${formatCurrency(Math.abs(stockInfo.change))} (${Math.abs(stockInfo.changePercent).toFixed(2)}%)`;

    // Update stats
    document.getElementById('openPrice').textContent = formatCurrency(stockInfo.open);
    document.getElementById('highPrice').textContent = formatCurrency(stockInfo.high);
    document.getElementById('lowPrice').textContent = formatCurrency(stockInfo.low);
    document.getElementById('volume').textContent = formatNumber(stockInfo.volume);
    document.getElementById('marketCap').textContent = formatCurrency(stockInfo.marketCap);
    document.getElementById('lastUpdated').textContent = formatDateTime(stockInfo.lastUpdated);

    // Show details section and hide search results
    document.getElementById('stockDetails').style.display = 'block';
    if (document.getElementById('searchResults')) {
        document.getElementById('searchResults').style.display = 'none';
    }

    // Update price chart
    updatePriceChart(stockInfo);
}

// Update price chart
function updatePriceChart(stockInfo) {
    const ctx = document.getElementById('priceChart').getContext('2d');

    if (priceChart) {
        priceChart.destroy();
    }

    if (!stockInfo.priceHistory || stockInfo.priceHistory.length === 0) {
        return;
    }

    const labels = stockInfo.priceHistory.map(point => point.date);
    const data = stockInfo.priceHistory.map(point => point.price);

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: stockInfo.ticker + ' 价格',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `价格: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Change time range
async function changeRange(range, button) {
    currentRange = range;

    // Update active button
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');

    // Reload stock info with new range
    if (currentStock) {
        try {
            const response = await fetch(`${STOCKS_API}/${currentStock.ticker}/history?range=${range}`);
            const stockInfo = await response.json();
            displayStockDetails(stockInfo);
        } catch (error) {
            console.error('Error loading stock history:', error);
        }
    }
}

// Show add to portfolio modal
function showAddToPortfolio() {
    if (!currentStock) {
        alert('请先搜索股票');
        return;
    }

    document.getElementById('addToPortfolioTicker').value = currentStock.ticker;
    document.getElementById('addToPortfolioPrice').value = currentStock.currentPrice;

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addToPortfolioDate').value = today;

    // 根据当前设置显示/隐藏输入框
    togglePriceInput();

    document.getElementById('addToPortfolioModal').style.display = 'block';
}

// Toggle price and date input based on asset type
function togglePriceInput() {
    const assetType = document.getElementById('addToPortfolioAssetType').value;
    const priceInputGroup = document.getElementById('priceInputGroup');
    const dateInputGroup = document.getElementById('dateInputGroup');
    const buyInfo = document.getElementById('buyInfo');

    if (assetType === 'CASH') {
        // 现金需要显示价格和日期输入
        priceInputGroup.style.display = 'block';
        dateInputGroup.style.display = 'block';
        buyInfo.style.display = 'none';
    } else {
        // 股票和债券不需要显示价格和日期（使用今日开盘价）
        priceInputGroup.style.display = 'none';
        dateInputGroup.style.display = 'none';
        buyInfo.style.display = 'block';
    }
}

// Add to portfolio
async function addToPortfolio(event) {
    event.preventDefault();

    const ticker = document.getElementById('addToPortfolioTicker').value;
    const assetType = document.getElementById('addToPortfolioAssetType').value;
    const volume = parseInt(document.getElementById('addToPortfolioVolume').value);

    // 对于股票和债券，使用买入接口；对于现金，使用创建接口
    if (assetType === 'CASH') {
        const holding = {
            ticker: 'CASH',
            stockName: '现金',
            assetType: 'CASH',
            volume: volume,
            purchasePrice: 1,
            currentPrice: 1,
            purchaseDate: document.getElementById('addToPortfolioDate').value
        };

        try {
            const response = await fetch(HOLDINGS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(holding)
            });

            if (response.ok) {
                closeAddToPortfolioModal();
                alert('成功添加现金到投资组合！');
            } else {
                const errorText = await response.text();
                alert('添加失败：' + errorText);
            }
        } catch (error) {
            console.error('Error adding to portfolio:', error);
            alert('添加失败，请检查网络连接');
        }
    } else {
        // 对于股票和债券，使用买入接口
        try {
            const response = await fetch(`${HOLDINGS_API}/buy?ticker=${ticker}&volume=${volume}`, {
                method: 'POST'
            });

            if (response.ok) {
                closeAddToPortfolioModal();
                alert('成功添加到投资组合！');
            } else {
                const errorText = await response.text();
                alert('添加失败：' + errorText);
            }
        } catch (error) {
            console.error('Error buying stock:', error);
            alert('添加失败，请检查网络连接');
        }
    }
}

// Refresh stock info
async function refreshStockInfo() {
    if (currentStock) {
        await searchStock();
        alert('数据已刷新！');
    }
}

// Close add to portfolio modal
function closeAddToPortfolioModal() {
    document.getElementById('addToPortfolioModal').style.display = 'none';
}
