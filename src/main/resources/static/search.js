let priceChart = null;
let changeChart = null;
let currentStock = null;
let currentRange = '1mo';
let shChart = null;
let szChart = null;
let cybChart = null;

// Handle search key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchStock();
    }
}

// Initialize market overview charts on page load
document.addEventListener('DOMContentLoaded', async function() {
    await initMarketOverview();
});

// Initialize market overview
async function initMarketOverview() {
    try {
        // Load data for Shanghai Composite (000001)
        const shResponse = await fetch(`${STOCKS_API}/000001/history?range=3mo`);
        const shData = await shResponse.json();
        initChart('shChart', '上证指数', shData, '#667eea');

        // Load data for Shenzhen Component (399001)
        const szResponse = await fetch(`${STOCKS_API}/399001/history?range=3mo`);
        const szData = await szResponse.json();
        initChart('szChart', '深证成指', szData, '#764ba2');

        // Load data for ChiNext Index (399006)
        const cybResponse = await fetch(`${STOCKS_API}/399006/history?range=3mo`);
        const cybData = await cybResponse.json();
        initChart('cybChart', '创业板指', cybData, '#f093fb');
    } catch (error) {
        console.error('Error initializing market overview:', error);
    }
}

// Handle search input - show market overview button when text is entered
function handleSearchInput(event) {
    const value = event.target.value.trim();
    const showMarketBtn = document.getElementById('showMarketBtn');
    const marketOverview = document.getElementById('marketOverview');

    if (value.length > 0) {
        showMarketBtn.style.display = 'inline-block';
    } else {
        showMarketBtn.style.display = 'none';
        marketOverview.style.display = 'block';
    }
}

// Show market overview
function showMarketOverview() {
    const marketOverview = document.getElementById('marketOverview');
    const stockDetails = document.getElementById('stockDetails');
    const searchResults = document.getElementById('searchResults');
    const showMarketBtn = document.getElementById('showMarketBtn');
    const searchInput = document.getElementById('searchInput');

    searchInput.value = '';
    stockDetails.style.display = 'none';
    searchResults.style.display = 'none';
    marketOverview.style.display = 'block';
    showMarketBtn.style.display = 'none';
}

// Initialize a single market chart
function initChart(canvasId, label, stockInfo, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (!stockInfo.priceHistory || stockInfo.priceHistory.length === 0) {
        return;
    }

    const labels = stockInfo.priceHistory.map(point => point.date);
    const data = stockInfo.priceHistory.map(point => point.price);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return '日期: ' + context[0].label;
                        },
                        label: function(context) {
                            return label + ': ' + context.raw.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        color: '#666'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        },
                        color: '#666'
                    }
                }
            }
        }
    });
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
        alert('Please enter a stock ticker or name');
        return;
    }

    // Hide market overview when searching
    const marketOverview = document.getElementById('marketOverview');
    if (marketOverview) {
        marketOverview.style.display = 'none';
    }

    try {
        // Try search first
        const searchResponse = await fetch(`${STOCKS_API}/search?query=${encodeURIComponent(query)}`);
        const searchResults = await searchResponse.json();

        if (searchResults && searchResults.length > 0) {
            // If there are search results, display the first one
            const ticker = searchResults[0].ticker;
            const response = await fetch(`${STOCKS_API}/${ticker}`);
            const stockInfo = await response.json();

            displayStockDetails(stockInfo);

            // If there are multiple search results, display the search results list
            if (searchResults.length > 1) {
                displaySearchResults(searchResults);
            }
        } else {
            // If there are no search results, query the stock ticker directly
            const ticker = query.toUpperCase();
            const response = await fetch(`${STOCKS_API}/${ticker}`);
            const stockInfo = await response.json();

            if (stockInfo && stockInfo.currentPrice > 0) {
                displayStockDetails(stockInfo);
            } else {
                alert('No matching stock found, please check your input');
            }
        }
    } catch (error) {
        console.error('Error searching stock:', error);
        alert('Search failed, please check network connection');
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

    // Update price chart and volume display
    updatePriceChart(stockInfo);
    updateTodayVolume(stockInfo);
}

// Update price chart (only price line, no volume)
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

    // Determine color based on price change (red for up, green for down - Chinese stock market convention)
    const firstPrice = data[0];
    const lastPrice = data[data.length - 1];
    const isUp = lastPrice >= firstPrice;
    
    // Red for up, green for down
    const lineColor = '#2196F3'; // Blue line
    const bgColor = isUp ? 'rgba(244, 67, 54, 0.15)' : 'rgba(76, 175, 80, 0.15)';

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: stockInfo.ticker + ' Price',
                data: data,
                borderColor: lineColor,
                backgroundColor: bgColor,
                borderWidth: 3,
                fill: true,
                tension: 0.5,
                pointRadius: 2,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return '日期: ' + context[0].label;
                        },
                        label: function(context) {
                            return '收盘价: ¥' + context.raw.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        color: '#666'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toFixed(2);
                        },
                        color: '#666'
                    }
                }
            }
        }
    });
}

// Update today's volume display
function updateTodayVolume(stockInfo) {
    const volume = stockInfo.volume || 0;
    const volumeElement = document.getElementById('volumeValue');
    const volumeBar = document.getElementById('volumeBar');

    // Format volume number (in millions for large numbers)
    const formattedVolume = volume >= 1000000 ?
        (volume / 1000000).toFixed(2) + 'M' :
        volume >= 1000 ?
        (volume / 1000).toFixed(2) + 'K' :
        volume.toString();

    volumeElement.textContent = formattedVolume + ' shares';

    // Calculate bar width based on volume (normalize to a reasonable range)
    // Assuming max expected volume is around 100 million shares for visualization
    const maxExpectedVolume = 100000000;
    const percentage = Math.min((volume / maxExpectedVolume) * 100, 100);

    // Set bar color based on price change
    const barColor = stockInfo.change >= 0 ? '#4caf50' : '#ef5350';
    volumeBar.style.width = percentage + '%';
    volumeBar.style.background = `linear-gradient(90deg, ${barColor}40 0%, ${barColor} 100%)`;
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
        alert('Please search for a stock first');
        return;
    }

    document.getElementById('addToPortfolioTicker').value = currentStock.ticker;
    document.getElementById('addToPortfolioPrice').value = currentStock.currentPrice;

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addToPortfolioDate').value = today;

    // Show/hide input fields based on current settings
    togglePriceInput();

    document.getElementById('addToPortfolioModal').style.display = 'block';
}

// Toggle price and date input based on asset type
function togglePriceInput() {
    const assetType = document.getElementById('addToPortfolioAssetType').value;
    const priceInputGroup = document.getElementById('priceInputGroup');
    const dateInputGroup = document.getElementById('dateInputGroup');
    const stockDateGroup = document.getElementById('stockDateGroup');
    const buyInfo = document.getElementById('buyInfo');

    if (assetType === 'CASH') {
        // Cash needs price and date input
        priceInputGroup.style.display = 'block';
        dateInputGroup.style.display = 'block';
        stockDateGroup.style.display = 'none';
        buyInfo.style.display = 'none';
    } else {
        // Stocks and bonds can select transaction date
        priceInputGroup.style.display = 'none';
        dateInputGroup.style.display = 'none';
        stockDateGroup.style.display = 'block';
        buyInfo.style.display = 'block';
    }
}

// Add to portfolio
async function addToPortfolio(event) {
    event.preventDefault();

    const ticker = document.getElementById('addToPortfolioTicker').value;
    const assetType = document.getElementById('addToPortfolioAssetType').value;
    const volume = parseInt(document.getElementById('addToPortfolioVolume').value);

    // For stocks and bonds, use buy interface; for cash, use create interface
    if (assetType === 'CASH') {
        const holding = {
            ticker: 'CASH',
            stockName: 'Cash',
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
                alert('Successfully added cash to portfolio!');
            } else {
                const errorText = await response.text();
                alert('Add failed: ' + errorText);
            }
        } catch (error) {
            console.error('Error adding to portfolio:', error);
            alert('Add failed, please check network connection');
        }
    } else {
        // For stocks and bonds, use buy interface
        const purchaseDate = document.getElementById('addToPortfolioStockDate').value || '';

        try {
            let url = `${HOLDINGS_API}/buy?ticker=${encodeURIComponent(ticker)}&volume=${volume}`;
            if (purchaseDate) {
                url += `&purchaseDate=${encodeURIComponent(purchaseDate)}`;
            }

            const response = await fetch(url, {
                method: 'POST'
            });

            if (response.ok) {
                closeAddToPortfolioModal();
                alert('Successfully added to portfolio!');
            } else {
                const errorText = await response.text();
                alert('Add failed: ' + errorText);
            }
        } catch (error) {
            console.error('Error buying stock:', error);
            alert('Add failed, please check network connection');
        }
    }
}

// Refresh stock info
async function refreshStockInfo() {
    if (currentStock) {
        await searchStock();
        alert('Data refreshed!');
    }
}

// Close add to portfolio modal
function closeAddToPortfolioModal() {
    document.getElementById('addToPortfolioModal').style.display = 'none';
}

// Export functions to window for HTML onclick handlers
window.handleKeyPress = handleKeyPress;
window.handleSearchInput = handleSearchInput;
window.showMarketOverview = showMarketOverview;
