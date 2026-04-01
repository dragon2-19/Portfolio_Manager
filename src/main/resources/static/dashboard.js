let assetTypeChart = null;
let portfolioDistributionChart = null;
let dailyProfitChart = null;
let currentStockInfo = null;

// Configure Chart.js global defaults
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

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
            loadRecentTransactions(),
            loadDailyProfitChart()
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
            profitLossElement.style.color = '#f44336'; // Red for profit (Chinese market)
        } else if (profitLossValue < 0) {
            profitLossElement.style.color = '#4caf50'; // Green for loss (Chinese market)
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

        // Reverse to show newest first, then take top 5
        const reversedTransactions = [...transactions].reverse();
        reversedTransactions.slice(0, 5).forEach(transaction => {
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

    // Use ticker directly from transaction object
    const ticker = transaction.ticker || (transaction.transactionType === 'DEPOSIT' || transaction.transactionType === 'WITHDRAW' ? 'CASH' : 'N/A');
    const name = transaction.stockName || '';

    item.innerHTML = `
        <div class="transaction-icon ${typeClass}">
            ${typeIcon}
        </div>
        <div class="transaction-info">
            <div class="transaction-ticker">${ticker} ${name ? `(${name})` : ''}</div>
            <div class="transaction-details">
                ${typeText} ${transaction.volume} @ ${formatCurrency(transaction.price)}
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

// ==================== Daily Profit Chart ====================

// Load daily profit chart
async function loadDailyProfitChart() {
    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();

        if (holdings.length === 0) {
            console.log('No holdings to calculate daily profit');
            return;
        }

        // Get all stock holdings (exclude cash)
        const stockHoldings = holdings.filter(h => h.assetType === 'STOCK');

        if (stockHoldings.length === 0) {
            console.log('No stock holdings to calculate daily profit');
            return;
        }

        // Calculate daily profit
        const dailyProfitData = await calculateDailyProfit(stockHoldings);

        // Update the chart
        updateDailyProfitChart(dailyProfitData);
    } catch (error) {
        console.error('Error loading daily profit chart:', error);
    }
}

// Calculate daily profit for all holdings
async function calculateDailyProfit(holdings) {
    console.log('Calculating daily profit for', holdings.length, 'holdings');

    // Get all purchase dates to determine date range
    const purchaseDates = holdings.map(h => new Date(h.purchaseDate));
    const minDate = new Date(Math.min(...purchaseDates));
    const today = new Date();

    // Limit date range to avoid too many data points (max 180 days)
    const maxDays = 180;
    const daysDiff = Math.floor((today - minDate) / (1000 * 60 * 60 * 24));

    const startDate = daysDiff > maxDays ?
        new Date(today.getTime() - maxDays * 24 * 60 * 60 * 1000) : minDate;

    // Generate date range from startDate to today
    const dateRange = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Date range:', dateRange.length, 'days from', dateRange[0], 'to', dateRange[dateRange.length - 1]);

    // Initialize daily profit map (date -> total profit)
    const dailyProfitMap = {};
    dateRange.forEach(date => {
        dailyProfitMap[date] = 0;
    });

    // For each holding, fetch historical prices and calculate daily profit
    for (const holding of holdings) {
        try {
            console.log(`Fetching history for ${holding.ticker}...`);
            // Fetch historical data (use 6mo range which should cover most cases)
            const response = await fetch(`${STOCKS_API}/${holding.ticker}/history?range=6mo`);
            const stockData = await response.json();

            if (!stockData.priceHistory || stockData.priceHistory.length === 0) {
                console.warn(`No price history for ${holding.ticker}`);
                continue;
            }

            const purchaseDateStr = holding.purchaseDate;
            const avgCost = holding.purchasePrice;
            const volume = holding.volume;

            // Calculate daily profit for this holding
            let profitCount = 0;
            stockData.priceHistory.forEach(pricePoint => {
                const priceDate = pricePoint.date;

                // Only calculate if price date is on or after purchase date
                if (priceDate >= purchaseDateStr && dailyProfitMap.hasOwnProperty(priceDate)) {
                    const dailyProfit = (pricePoint.price - avgCost) * volume;
                    dailyProfitMap[priceDate] += dailyProfit;
                    profitCount++;
                }
            });

            console.log(`Calculated ${profitCount} profit points for ${holding.ticker}`);

        } catch (error) {
            console.error(`Error fetching history for ${holding.ticker}:`, error);
        }
    }

    // Convert to arrays for Chart.js
    const labels = dateRange;
    const data = dateRange.map(date => dailyProfitMap[date] || 0);

    console.log('Daily profit calculation completed. Data points:', data.length);

    return { labels, data };
}

// Update daily profit chart
function updateDailyProfitChart(dailyProfitData) {
    const canvas = document.getElementById('dailyProfitChart');
    if (!canvas) {
        console.error('Daily profit chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');

    if (dailyProfitChart) {
        dailyProfitChart.destroy();
    }

    // Determine color based on overall profit trend
    const firstProfit = dailyProfitData.data[0] || 0;
    const lastProfit = dailyProfitData.data[dailyProfitData.data.length - 1] || 0;
    const isProfitable = lastProfit >= 0;
    const isGrowing = lastProfit >= firstProfit;

    // Use red for profit/growing, green for loss/declining (Chinese stock market convention)
    const lineColor = '#667eea'; // Blue for neutral
    const areaColor = isProfitable ? 'rgba(244, 67, 54, 0.15)' : 'rgba(76, 175, 80, 0.15)';

    dailyProfitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyProfitData.labels,
            datasets: [{
                label: 'Daily Profit (¥)',
                data: dailyProfitData.data,
                borderColor: lineColor,
                backgroundColor: areaColor,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
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
                            return 'date: ' + context[0].label;
                        },
                        label: function(context) {
                            const value = context.raw;
                            return 'Accumulated Profit: ¥' + value.toFixed(2);
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
                        maxTicksLimit: 12,
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toFixed(0);
                        },
                        color: '#94a3b8'
                    }
                }
            }
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

// ==================== AI Analysis Functions ====================

// Get API configuration from localStorage
function getApiConfig() {
    const savedConfig = localStorage.getItem('deepseekApiConfig');
    if (savedConfig) {
        return JSON.parse(savedConfig);
    }
    return null;
}

// Fetch portfolio data for AI analysis
async function fetchPortfolioData() {
    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();
        
        if (holdings.length === 0) {
            return null;
        }
        
        let portfolioText = "=== Portfolio Summary ===\n\n";
        portfolioText += `Total Holdings: ${holdings.length}\n\n`;
        
        // Group by asset type
        const stocks = holdings.filter(h => h.assetType === 'STOCK');
        const bonds = holdings.filter(h => h.assetType === 'BOND');
        const cash = holdings.filter(h => h.assetType === 'CASH');
        
        portfolioText += `Stocks: ${stocks.length}\n`;
        portfolioText += `Bonds: ${bonds.length}\n`;
        portfolioText += `Cash: ${cash.length}\n\n`;
        
        portfolioText += "=== Holdings Detail ===\n\n";
        
        holdings.forEach(holding => {
            const totalValue = holding.totalValue || 0;
            const profitLoss = holding.profitLoss || 0;
            const returnPercent = holding.returnPercentage || 0;
            
            portfolioText += `${holding.ticker} | ${holding.assetType} | ${holding.volume} shares | `;
            portfolioText += `Cost: ${formatCurrency(holding.purchasePrice)} | `;
            portfolioText += `Value: ${formatCurrency(totalValue)} | `;
            portfolioText += `P/L: ${formatCurrency(profitLoss)} (${returnPercent.toFixed(2)}%)\n`;
        });
        
        // Calculate total value
        const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
        const totalProfitLoss = holdings.reduce((sum, h) => sum + (h.profitLoss || 0), 0);
        
        portfolioText += "\n=== Portfolio Totals ===\n";
        portfolioText += `Total Value: ${formatCurrency(totalPortfolioValue)}\n`;
        portfolioText += `Total P/L: ${formatCurrency(totalProfitLoss)}\n`;
        
        // Calculate allocation by type
        if (totalPortfolioValue > 0) {
            const stockAllocation = (stocks.reduce((sum, h) => sum + (h.totalValue || 0), 0) / totalPortfolioValue * 100).toFixed(1);
            const bondAllocation = (bonds.reduce((sum, h) => sum + (h.totalValue || 0), 0) / totalPortfolioValue * 100).toFixed(1);
            const cashAllocation = (cash.reduce((sum, h) => sum + (h.totalValue || 0), 0) / totalPortfolioValue * 100).toFixed(1);
            
            portfolioText += `\n=== Asset Allocation ===\n`;
            portfolioText += `Stocks: ${stockAllocation}% | Bonds: ${bondAllocation}% | Cash: ${cashAllocation}%\n`;
        }
        
        return portfolioText;
        
    } catch (error) {
        console.error('Error fetching portfolio data:', error);
        return null;
    }
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
                    content: `You are an expert financial advisor. Provide concise, actionable insights. Use bullet points, bold text for key points, and keep responses under 500 words. Focus on the most important insights.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: apiConfig.temperature || 0.7,
            max_tokens: 800,
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

// Show loading state in AI modal
function showAiLoading(title) {
    document.getElementById('aiModalTitle').textContent = title;
    document.getElementById('aiModalStatus').innerHTML = `
        <div class="ai-loading">
            <div class="loading-spinner"></div>
            <span>Analyzing...</span>
        </div>
    `;
    document.getElementById('aiModalBody').innerHTML = '';
    document.getElementById('aiAnalysisModal').style.display = 'block';
}

// Close AI analysis modal
function closeAiAnalysisModal() {
    document.getElementById('aiAnalysisModal').style.display = 'none';
}

// Get Portfolio Review
async function getPortfolioReview() {
    const portfolioData = await fetchPortfolioData();
    
    if (!portfolioData) {
        showAlert('No holdings data available. Please add some holdings first.', 'warning');
        return;
    }
    
    showAiLoading('💼 Portfolio Review');
    
    try {
        const prompt = `Please provide a concise portfolio review:

${portfolioData}

Focus on:
1. **Portfolio Health**: Overall assessment and health score (1-10)
2. **Diversification**: Sector and asset type analysis
3. **Performance**: Returns and key insights
4. **Top Picks**: Best performing holdings
5. **Concerns**: Any red flags or issues
6. **Recommendations**: 3-5 actionable suggestions

Keep it concise and use markdown formatting with headers (#), bold (**text**), lists (- or *), and bullet points.`;
        
        // Show modal and start streaming
        document.getElementById('aiModalTitle').textContent = '💼 Portfolio Review';
        document.getElementById('aiModalStatus').innerHTML = `
            <div class="ai-loading">
                <div class="loading-spinner"></div>
                <span>Analyzing...</span>
            </div>
        `;
        document.getElementById('aiModalBody').innerHTML = '<div class="ai-content" id="aiStreamingContent"></div>';
        document.getElementById('aiAnalysisModal').style.display = 'block';
        
        await callDeepSeekAPI(
            prompt,
            (content) => {
                // On chunk - update content
                document.getElementById('aiStreamingContent').innerHTML = formatMarkdown(content);
                document.getElementById('aiModalBody').scrollTop = document.getElementById('aiModalBody').scrollHeight;
            },
            (finalContent) => {
                // On complete - hide loading
                document.getElementById('aiModalStatus').innerHTML = '';
            },
            (error) => {
                // On error
                console.error('Error getting portfolio review:', error);
                document.getElementById('aiModalStatus').innerHTML = `
                    <div class="ai-error">
                        ❌ Error: ${error.message}
                    </div>
                `;
            }
        );
        
    } catch (error) {
        console.error('Error getting portfolio review:', error);
        document.getElementById('aiModalStatus').innerHTML = `
            <div class="ai-error">
                ❌ Error: ${error.message}
            </div>
        `;
    }
}

// Get Risk Management
async function getRiskManagement() {
    const portfolioData = await fetchPortfolioData();
    
    if (!portfolioData) {
        showAlert('No holdings data available. Please add some holdings first.', 'warning');
        return;
    }
    
    showAiLoading('⚠️ Risk Management');
    
    try {
        const prompt = `Please provide a comprehensive risk assessment:

${portfolioData}

Focus on:
1. **Risk Level**: Overall portfolio risk (Low/Medium/High)
2. **Sector Concentration**: Any overexposed sectors
3. **Single Stock Risk**: Holdings that are too large
4. **Market Risk**: Exposure to market volatility
5. **Risk Mitigation**: 5 specific strategies to reduce risk
6. **Stop Loss**: Recommended stop-loss levels
7. **Position Sizing**: Suggestions for optimal allocation

Be specific and actionable. Use markdown formatting with headers (#), bold (**text**), lists (- or *), and bullet points.`;
        
        // Show modal and start streaming
        document.getElementById('aiModalTitle').textContent = '⚠️ Risk Management';
        document.getElementById('aiModalStatus').innerHTML = `
            <div class="ai-loading">
                <div class="loading-spinner"></div>
                <span>Analyzing...</span>
            </div>
        `;
        document.getElementById('aiModalBody').innerHTML = '<div class="ai-content" id="aiStreamingContent"></div>';
        document.getElementById('aiAnalysisModal').style.display = 'block';
        
        await callDeepSeekAPI(
            prompt,
            (content) => {
                // On chunk - update content
                document.getElementById('aiStreamingContent').innerHTML = formatMarkdown(content);
                document.getElementById('aiModalBody').scrollTop = document.getElementById('aiModalBody').scrollHeight;
            },
            (finalContent) => {
                // On complete - hide loading
                document.getElementById('aiModalStatus').innerHTML = '';
            },
            (error) => {
                // On error
                console.error('Error getting risk management:', error);
                document.getElementById('aiModalStatus').innerHTML = `
                    <div class="ai-error">
                        ❌ Error: ${error.message}
                    </div>
                `;
            }
        );
        
    } catch (error) {
        console.error('Error getting risk management:', error);
        document.getElementById('aiModalStatus').innerHTML = `
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

// Export functions to window
window.closeAiAnalysisModal = closeAiAnalysisModal;
window.getPortfolioReview = getPortfolioReview;
window.getRiskManagement = getRiskManagement;
