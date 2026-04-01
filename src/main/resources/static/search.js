let priceChart = null;
let changeChart = null;
let candlestickChart = null;
let currentStock = null;
let currentRange = '1mo';
let shChart = null;
let szChart = null;
let cybChart = null;

// Configure Chart.js global defaults
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

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
        console.log('Initializing market overview...');

        // Load data for Shanghai Composite (000001)
        const shResponse = await fetch(`${STOCKS_API}/000001/history?range=3mo`);
        const shData = await shResponse.json();
        console.log('Shanghai Composite data loaded:', shData);
        initChart('shChart', '上证指数', shData, '#667eea');

        // Load data for Shenzhen Component (399001)
        const szResponse = await fetch(`${STOCKS_API}/399001/history?range=3mo`);
        const szData = await szResponse.json();
        console.log('Shenzhen Component data loaded:', szData);
        initChart('szChart', '深证成指', szData, '#764ba2');

        // Load data for ChiNext Index (399006)
        const cybResponse = await fetch(`${STOCKS_API}/399006/history?range=3mo`);
        const cybData = await cybResponse.json();
        console.log('ChiNext Index data loaded:', cybData);
        initChart('cybChart', '创业板指', cybData, '#f093fb');

        console.log('Market overview initialized successfully');
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
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas element not found:', canvasId);
        return;
    }

    const ctx = canvas.getContext('2d');

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
                        display: false,
                        color: '#666'
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        },
                        color: '#94a3b8'
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

    // Update price chart, candlestick chart and volume display
    updatePriceChart(stockInfo);
    updateCandlestickChart(stockInfo);
    updateTodayVolume(stockInfo);
}

// Update price chart (only price line, no volume)
function updatePriceChart(stockInfo) {
    const canvas = document.getElementById('priceChart');
    if (!canvas) {
        console.error('Price chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');

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
                        display: false,
                        color: '#94a3b8'
                    },
                    ticks: {
                        maxTicksLimit: 10,
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toFixed(2);
                        },
                        color: '#94a3b8'
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

    // Set bar color based on price change - red for up, green for down (Chinese stock market)
    const barColor = stockInfo.change >= 0 ? '#f44336' : '#4caf50';
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
    const lots = parseInt(document.getElementById('addToPortfolioVolume').value);
    const shares = lots * 100; // Convert lots to shares (1 lot = 100 shares)

    // For stocks and bonds, use buy interface; for cash, use create interface
    if (assetType === 'CASH') {
        const holding = {
            ticker: 'CASH',
            stockName: 'Cash',
            assetType: 'CASH',
            volume: lots * 100,  // Convert lots to shares
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
            let url = `${HOLDINGS_API}/buy?ticker=${encodeURIComponent(ticker)}&volume=${shares}`;
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

// ==================== Stock Analysis Functions ====================

// Get API configuration from localStorage
function getApiConfig() {
    const savedConfig = localStorage.getItem('deepseekApiConfig');
    if (savedConfig) {
        return JSON.parse(savedConfig);
    }
    return null;
}

// Call DeepSeek API with streaming
async function callDeepSeekAPI(prompt, onChunk, onComplete, onError) {
    const apiConfig = getApiConfig();

    if (!apiConfig || !apiConfig.apiKey) {
        throw new Error('Please configure your API key first in AI Assistant page');
    }

    const url = `${apiConfig.baseUrl}/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
            model: apiConfig.model || 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert financial analyst. Provide comprehensive stock analysis including fundamental and technical analysis. Be specific, data-driven, and actionable. Use markdown formatting with headers (#), bold (**text**), lists (- or *), and bullet points. Keep responses under 800 words.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: apiConfig.temperature || 0.7,
            max_tokens: 1200,
            stream: true
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            if (onComplete) onComplete(fullContent);
            break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                    if (onComplete) onComplete(fullContent);
                    return;
                }

                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content;

                    if (content) {
                        fullContent += content;
                        if (onChunk) onChunk(fullContent);
                    }
                } catch (e) {
                    // Ignore parsing errors for keep-alive messages
                }
            }
        }
    }
}

// Get Stock Analysis
async function getStockAnalysis() {
    if (!currentStock) {
        alert('Please search for a stock first');
        return;
    }

    // Prepare stock data for analysis
    let stockData = `=== Stock Information ===\n\n`;
    stockData += `Ticker: ${currentStock.ticker}\n`;
    stockData += `Name: ${currentStock.name || 'N/A'}\n`;
    stockData += `Current Price: ${formatCurrency(currentStock.currentPrice)}\n`;
    stockData += `Daily Change: ${formatCurrency(Math.abs(currentStock.change))} (${Math.abs(currentStock.changePercent || 0).toFixed(2)}%)\n`;
    stockData += `Direction: ${currentStock.change > 0 ? 'Up' : currentStock.change < 0 ? 'Down' : 'Flat'}\n`;
    stockData += `Open: ${formatCurrency(currentStock.open)}\n`;
    stockData += `High: ${formatCurrency(currentStock.high)}\n`;
    stockData += `Low: ${formatCurrency(currentStock.low)}\n`;
    stockData += `Volume: ${formatNumber(currentStock.volume)}\n`;
    stockData += `Market Cap: ${formatCurrency(currentStock.marketCap)}\n`;
    stockData += `Last Updated: ${formatDateTime(currentStock.lastUpdated)}\n\n`;

    // Add price history if available
    if (currentStock.priceHistory && currentStock.priceHistory.length > 0) {
        stockData += `=== Price History ===\n\n`;
        const recentHistory = currentStock.priceHistory.slice(-10);
        recentHistory.forEach(point => {
            stockData += `${point.date}: ${formatCurrency(point.price)}\n`;
        });
        stockData += '\n';
    }

    // Show modal and start streaming
    document.getElementById('stockAnalysisModalTitle').textContent = `📊 Stock Analysis - ${currentStock.ticker}`;
    document.getElementById('stockAnalysisModalStatus').innerHTML = `
        <div class="ai-loading">
            <div class="loading-spinner"></div>
            <span>Analyzing...</span>
        </div>
    `;
    document.getElementById('stockAnalysisModalBody').innerHTML = '<div class="ai-content" id="stockAnalysisStreamingContent"></div>';
    document.getElementById('stockAnalysisModal').style.display = 'block';

    const prompt = `Please provide a comprehensive stock analysis for:

${stockData}

Please cover:
1. **Company Overview**: Business model and key information
2. **Fundamental Analysis**: Financial health, valuation metrics, P/E ratio interpretation
3. **Technical Analysis**: Recent price trends, key support/resistance levels, momentum indicators
4. **Risk Factors**: Main risks to consider
5. **Investment Verdict**: Buy/Hold/Sell recommendation with reasoning (1-10 score)
6. **Price Targets**: Short-term and long-term price projections
7. **Actionable Advice**: Specific recommendations for investors

Be concise but thorough. Use markdown formatting with headers, bold text for key points, and bullet points for lists.`;

    try {
        await callDeepSeekAPI(
            prompt,
            (content) => {
                // On chunk - update content
                const streamingContent = document.getElementById('stockAnalysisStreamingContent');
                if (streamingContent) {
                    streamingContent.innerHTML = formatMarkdown(content);
                    document.getElementById('stockAnalysisModalBody').scrollTop = document.getElementById('stockAnalysisModalBody').scrollHeight;
                }
            },
            (finalContent) => {
                // On complete - hide loading
                document.getElementById('stockAnalysisModalStatus').innerHTML = '';
            },
            (error) => {
                // On error
                console.error('Error getting stock analysis:', error);
                document.getElementById('stockAnalysisModalStatus').innerHTML = `
                    <div class="ai-error">
                        ❌ Error: ${error.message}
                    </div>
                `;
            }
        );
    } catch (error) {
        console.error('Error getting stock analysis:', error);
        document.getElementById('stockAnalysisModalStatus').innerHTML = `
            <div class="ai-error">
                ❌ Error: ${error.message}
            </div>
        `;
    }
}

// Format markdown to HTML
function formatMarkdown(text) {
    if (!text) return '';

    // Escape HTML first
    let lines = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .split('\n');

    let html = '';
    let inList = false;
    let listType = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Code blocks
        if (line.startsWith('```')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<pre class="ai-code-block"><code>' + line.slice(3) + '</code></pre>';
            continue;
        }

        // Headers
        const headerMatch = line.match(/^(#{1,3})\s+(.*)$/);
        if (headerMatch) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            const level = headerMatch[1].length;
            const content = headerMatch[2];
            if (level === 3) {
                html += '<h3 class="ai-h3">' + content + '</h3>';
            } else if (level === 2) {
                html += '<h2 class="ai-h2">' + content + '</h2>';
            } else {
                html += '<h1 class="ai-h1">' + content + '</h1>';
            }
            continue;
        }

        // Horizontal rule
        if (line.match(/^(\-{3,}|\*{3,})$/)) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<hr class="ai-hr">';
            continue;
        }

        // Empty lines
        if (!line.trim()) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            continue;
        }

        // Bold (**text**)
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="ai-bold">$1</strong>');

        // Italic (*text*) - only if not part of bold
        line = line.replace(/\*([^*]+)\*/g, '<em class="ai-italic">$1</em>');

        // Inline code (`code`)
        line = line.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');

        // Numbered list (1. item)
        const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
            if (!inList || listType !== 'numbered') {
                if (inList) html += '</ul>';
                html += '<ol class="ai-list-numbered">';
                inList = true;
                listType = 'numbered';
            }
            html += '<li>' + numberedMatch[2] + '</li>';
            continue;
        }

        // Bullet list (- item or * item)
        const bulletMatch = line.match(/^[-*]\s+(.*)$/);
        if (bulletMatch) {
            if (!inList || listType !== 'bullet') {
                if (inList) html += '</ul>';
                html += '<ul class="ai-list-bullet">';
                inList = true;
                listType = 'bullet';
            }
            html += '<li>' + bulletMatch[1] + '</li>';
            continue;
        }

        // Regular paragraph
        if (inList) {
            html += '</ul>';
            inList = false;
        }

        html += '<p class="ai-paragraph">' + line + '</p>';
    }

    // Close any open list
    if (inList) {
        html += '</ul>';
    }

    return html;
}

// Update candlestick chart with ECharts
function updateCandlestickChart(stockInfo) {
    const chartDom = document.getElementById('candlestickChart');
    if (!chartDom) {
        console.error('Candlestick chart container not found');
        return;
    }

    // Dispose existing chart if it exists
    if (candlestickChart) {
        candlestickChart.dispose();
    }

    if (!stockInfo.priceHistory || stockInfo.priceHistory.length === 0) {
        return;
    }

    // Initialize ECharts instance
    candlestickChart = echarts.init(chartDom);

    // Prepare data for candlestick chart
    // Format: [open, close, lowest, highest]
    const data = stockInfo.priceHistory.map(point => {
        // Use price as close price if not available
        const close = point.price;
        const open = point.open || point.price;
        const low = point.low || Math.min(parseFloat(open), parseFloat(close));
        const high = point.high || Math.max(parseFloat(open), parseFloat(close));
        return [
            parseFloat(open).toFixed(2),
            parseFloat(close).toFixed(2),
            parseFloat(low).toFixed(2),
            parseFloat(high).toFixed(2)
        ];
    });

    // Prepare dates for x-axis
    const dates = stockInfo.priceHistory.map(point => point.date);

    // Prepare volume data for bar chart
    const volumes = stockInfo.priceHistory.map(point => {
        const open = point.open || point.price;
        const close = point.price;
        const isUp = parseFloat(close) >= parseFloat(open);
        return {
            value: 0, // Will be set based on actual volume if available
            itemStyle: {
                color: isUp ? '#ef5350' : '#26a69a'
            }
        };
    });

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#333',
            borderWidth: 1,
            textStyle: {
                color: '#fff'
            },
            formatter: function(params) {
                if (!params || params.length === 0) return '';

                const dataIndex = params[0].dataIndex;
                const point = stockInfo.priceHistory[dataIndex];
                const open = parseFloat(data[dataIndex][0]);
                const close = parseFloat(data[dataIndex][1]);
                const low = parseFloat(data[dataIndex][2]);
                const high = parseFloat(data[dataIndex][3]);
                const change = ((close - open) / open * 100).toFixed(2);
                const changeSign = change >= 0 ? '+' : '';

                return `
                    <div style="padding: 10px; min-width: 150px;">
                        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${point.date}</div>
                        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                            <span>open:</span>
                            <span style="color: #fff;">¥${open.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                            <span>close:</span>
                            <span style="color: #fff;">¥${close.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                            <span>hign:</span>
                            <span style="color: #fff;">¥${high.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                            <span>low:</span>
                            <span style="color: #fff;">¥${low.toFixed(2)}</span>
                        </div>
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444; color: ${change >= 0 ? '#ef5350' : '#26a69a'};">
                            ups and downs: ${changeSign}${change}%
                        </div>
                    </div>
                `;
            }
        },
        grid: [
            {
                left: '10%',
                right: '10%',
                top: '10%',
                height: '55%'
            },
            {
                left: '10%',
                right: '10%',
                top: '70%',
                height: '20%'
            }
        ],
        xAxis: [
            {
                type: 'category',
                data: dates,
                scale: true,
                boundaryGap: false,
                axisLine: {
                    onZero: false,
                    lineStyle: {
                        color: '#94a3b8'
                    }
                },
                axisLabel: {
                    color: '#94a3b8',
                    fontSize: 10
                },
                splitLine: {
                    show: false
                },
                min: 'dataMin',
                max: 'dataMax'
            },
            {
                type: 'category',
                gridIndex: 1,
                data: dates,
                scale: true,
                boundaryGap: false,
                axisLine: {
                    onZero: false,
                    lineStyle: {
                        color: '#94a3b8'
                    }
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    show: false
                },
                axisLabel: {
                    show: false
                },
                min: 'dataMin',
                max: 'dataMax'
            }
        ],
        yAxis: [
            {
                scale: true,
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: '#94a3b8'
                    }
                },
                axisLabel: {
                    color: '#94a3b8',
                    formatter: '¥{value}'
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.08)'
                    }
                }
            },
            {
                scale: true,
                gridIndex: 1,
                splitNumber: 2,
                axisLabel: {
                    show: false
                },
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    show: false
                }
            }
        ],
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: [0, 1],
                start: 50,
                end: 100
            },
            {
                show: true,
                xAxisIndex: [0, 1],
                type: 'slider',
                top: '92%',
                start: 50,
                end: 100,
                borderColor: '#444',
                backgroundColor: 'rgba(0,0,0,0.3)',
                fillerColor: 'rgba(100, 150, 255, 0.2)',
                textStyle: {
                    color: '#94a3b8'
                }
            }
        ],
        series: [
            {
                name: 'K-line',
                type: 'candlestick',
                data: data,
                itemStyle: {
                    color: '#ef5350',      // 阳线 (上涨) - 红色
                    color0: '#26a69a',    // 阴线 (下跌) - 绿色
                    borderColor: '#ef5350',
                    borderColor0: '#26a69a'
                },
                markLine: {
                    data: [
                        { type: 'average', name: 'MA' }
                    ]
                }
            },
            {
                name: 'MA5',
                type: 'line',
                data: calculateMA(5, stockInfo.priceHistory),
                smooth: true,
                lineStyle: {
                    opacity: 0.8,
                    width: 1,
                    color: '#f39c12'
                },
                symbol: 'none'
            },
            {
                name: 'MA10',
                type: 'line',
                data: calculateMA(10, stockInfo.priceHistory),
                smooth: true,
                lineStyle: {
                    opacity: 0.8,
                    width: 1,
                    color: '#3498db'
                },
                symbol: 'none'
            },
            {
                name: 'MA20',
                type: 'line',
                data: calculateMA(20, stockInfo.priceHistory),
                smooth: true,
                lineStyle: {
                    opacity: 0.8,
                    width: 1,
                    color: '#9b59b6'
                },
                symbol: 'none'
            },
            {
                name: 'Volume',
                type: 'bar',
                xAxisIndex: 1,
                yAxisIndex: 1,
                data: volumes,
                itemStyle: {
                    borderRadius: 2
                }
            }
        ]
    };

    candlestickChart.setOption(option);

    // Resize chart on window resize
    window.addEventListener('resize', function() {
        if (candlestickChart) {
            candlestickChart.resize();
        }
    });
}

// Calculate Moving Average
function calculateMA(dayCount, data) {
    var result = [];
    for (var i = 0, len = data.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        }
        var sum = 0;
        for (var j = 0; j < dayCount; j++) {
            // Extract numeric value from price
            var priceValue = data[i - j].price;
            if (typeof priceValue === 'object' && priceValue.toFixed) {
                sum += parseFloat(priceValue.toFixed(2));
            } else {
                sum += parseFloat(priceValue);
            }
        }
        result.push((sum / dayCount).toFixed(2));
    }
    return result;
}

// Close Stock Analysis Modal
function closeStockAnalysisModal() {
    document.getElementById('stockAnalysisModal').style.display = 'none';
}

// Export additional functions to window
window.getStockAnalysis = getStockAnalysis;
window.closeStockAnalysisModal = closeStockAnalysisModal;
