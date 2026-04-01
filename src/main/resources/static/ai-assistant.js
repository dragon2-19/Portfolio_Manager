// DeepSeek API Configuration
let apiConfig = {
    apiKey: '',
    model: 'deepseek-chat',
    temperature: 0.7,
    baseUrl: 'https://api.deepseek.com/v1',
    provider: 'deepseek'
};

// Provider configurations
const providerConfigs = {
    deepseek: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKeyUrl: 'https://platform.deepseek.com/',
        models: [
            { value: 'deepseek-chat', label: 'DeepSeek Chat' },
            { value: 'deepseek-coder', label: 'DeepSeek Coder' }
        ]
    },
    qwen: {
        name: 'Qwen (通义千问)',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
        models: [
            { value: 'qwen-turbo', label: 'Qwen Turbo' },
            { value: 'qwen-plus', label: 'Qwen Plus' },
            { value: 'qwen-max', label: 'Qwen Max' },
            { value: 'qwen-max-longcontext', label: 'Qwen Max Long Context' }
        ]
    },
    kimi: {
        name: 'Kimi (月之暗面)',
        baseUrl: 'https://api.moonshot.cn/v1',
        apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
        models: [
            { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
            { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
            { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' }
        ]
    },
    chatgpt: {
        name: 'ChatGPT (OpenAI)',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        models: [
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
        ]
    },
    doubao: {
        name: 'Doubao (豆包)',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKeyUrl: 'https://console.volcengine.com/ark',
        models: [
            { value: 'ep-20240509171831-mn8w8', label: 'Doubao Pro' },
            { value: 'ep-20240509171848-h7d2z', label: 'Doubao Lite' }
        ]
    },
    chatglm: {
        name: 'ChatGLM (智谱)',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
        models: [
            { value: 'glm-4', label: 'GLM-4' },
            { value: 'glm-4-plus', label: 'GLM-4 Plus' },
            { value: 'glm-4-0520', label: 'GLM-4-0520' },
            { value: 'glm-4-air', label: 'GLM-4 Air' },
            { value: 'glm-4-airx', label: 'GLM-4 AirX' },
            { value: 'glm-4-flash', label: 'GLM-4 Flash' }
        ]
    }
};

// Chat history
let chatHistory = [];
let isTyping = false;

// Prompt templates
const promptTemplates = {
    analysis: `Please analyze the following stock for me:

[STOCK TICKER CODE]

Please provide a comprehensive analysis including:
1. Company overview and business model
2. Financial performance analysis (revenue, profit, growth)
3. Valuation analysis (P/E ratio, market cap)
4. Competitive advantages
5. Risk factors
6. Technical indicators and recent price trends
7. Investment recommendation with reasoning

Please provide specific data points and actionable insights.`,

    portfolio: `Please review my investment portfolio and provide detailed analysis:

My Current Portfolio:
[PORTFOLIO_DATA_WILL_BE_INSERTED]

Please provide:
1. Diversification analysis across different sectors and asset types
2. Risk assessment of current holdings
3. Portfolio performance evaluation
4. Suggestions for rebalancing and optimization
5. Areas for potential improvement
6. Overall portfolio health score (1-10) with reasoning
7. Specific recommendations based on my current allocation

Please consider risk-return balance, sector concentration, and overall market position.`,

    market: `Please provide comprehensive market trend analysis based on current data:

[MARKET_DATA_WILL_BE_INSERTED]

Please cover:
1. Overall market sentiment and direction (Shanghai Composite, Shenzhen Component, ChiNext)
2. Key sectors performing well or poorly
3. Major economic indicators and their implications
4. Recent market events and their impact
5. Upcoming events that might impact markets
6. Investment opportunities in the current environment
7. Risk factors to consider

Provide actionable insights and investment recommendations based on current market conditions.`,

    risk: `Please perform a comprehensive risk assessment and provide management strategies for my portfolio:

My Current Portfolio:
[PORTFOLIO_DATA_WILL_BE_INSERTED]

Please analyze and provide:
1. Portfolio risk profile assessment
2. Risk factors to consider for each holding
3. Sector concentration risks
4. Market risk exposure analysis
5. Strategies to mitigate identified risks
6. Stop-loss and take-profit recommendations for each position
7. Position sizing and portfolio allocation advice
8. Risk management best practices tailored to my portfolio
9. Worst-case scenario analysis

Provide specific, actionable risk management strategies.`,

    strategy: `Based on my current portfolio and investment goals, please suggest a personalized investment strategy:

My Current Portfolio:
[PORTFOLIO_DATA_WILL_BE_INSERTED]

Please provide:
1. Recommended asset allocation adjustments
2. Investment timeframe advice
3. Specific stocks or sectors to focus on
4. Dollar-cost averaging strategy implementation
5. Rebalancing frequency and method
6. Growth vs. value balance recommendations
7. Income vs. growth strategy
8. Tax efficiency considerations
9. Exit strategies for underperforming positions
10. New investment opportunities aligned with my portfolio

Provide a clear, actionable strategy with specific recommendations.`
};

// Fetch portfolio data for templates
async function fetchPortfolioForTemplate() {
    try {
        const response = await fetch(HOLDINGS_API);
        const holdings = await response.json();
        
        if (holdings.length === 0) {
            return "No holdings data available. Please add some holdings to your portfolio first.";
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
        
        portfolioText += "=== Individual Holdings ===\n\n";
        
        holdings.forEach(holding => {
            const totalValue = holding.totalValue || 0;
            const profitLoss = holding.profitLoss || 0;
            const returnPercent = holding.returnPercentage || 0;
            
            portfolioText += `Ticker: ${holding.ticker}\n`;
            portfolioText += `Name: ${holding.stockName || 'N/A'}\n`;
            portfolioText += `Type: ${holding.assetType}\n`;
            portfolioText += `Volume: ${holding.volume}\n`;
            portfolioText += `Avg Cost: ${formatCurrency(holding.purchasePrice)}\n`;
            portfolioText += `Current Price: ${formatCurrency(holding.currentPrice)}\n`;
            portfolioText += `Total Value: ${formatCurrency(totalValue)}\n`;
            portfolioText += `P/L: ${formatCurrency(profitLoss)} (${returnPercent.toFixed(2)}%)\n`;
            portfolioText += `Purchase Date: ${formatDate(holding.purchaseDate)}\n`;
            portfolioText += "---\n\n";
        });
        
        // Calculate total value
        const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
        const totalProfitLoss = holdings.reduce((sum, h) => sum + (h.profitLoss || 0), 0);
        
        portfolioText += "=== Portfolio Summary ===\n\n";
        portfolioText += `Total Portfolio Value: ${formatCurrency(totalPortfolioValue)}\n`;
        portfolioText += `Total Profit/Loss: ${formatCurrency(totalProfitLoss)}\n`;
        
        // Calculate allocation by type
        if (totalPortfolioValue > 0) {
            const stockAllocation = (stocks.reduce((sum, h) => sum + (h.totalValue || 0), 0) / totalPortfolioValue * 100).toFixed(2);
            const bondAllocation = (bonds.reduce((sum, h) => sum + (h.totalValue || 0), 0) / totalPortfolioValue * 100).toFixed(2);
            const cashAllocation = (cash.reduce((sum, h) => sum + (h.totalValue || 0), 0) / totalPortfolioValue * 100).toFixed(2);
            
            portfolioText += `\n=== Asset Allocation ===\n`;
            portfolioText += `Stocks: ${stockAllocation}%\n`;
            portfolioText += `Bonds: ${bondAllocation}%\n`;
            portfolioText += `Cash: ${cashAllocation}%\n`;
        }
        
        return portfolioText;
        
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return "Error fetching portfolio data. Please try again.";
    }
}

// Fetch market data for templates
async function fetchMarketDataForTemplate() {
    try {
        // Fetch major indices
        const [shResponse, szResponse, cybResponse] = await Promise.all([
            fetch(`${STOCKS_API}/000001`),
            fetch(`${STOCKS_API}/399001`),
            fetch(`${STOCKS_API}/399006`)
        ]);
        
        const shData = await shResponse.json();
        const szData = await szResponse.json();
        const cybData = await cybResponse.json();
        
        let marketText = "=== Major Market Indices ===\n\n";
        
        marketText += `Shanghai Composite (000001):\n`;
        marketText += `Current: ${formatCurrency(shData.currentPrice)}\n`;
        marketText += `Change: ${formatCurrency(shData.change)} (${shData.changePercent?.toFixed(2) || 0}%)\n`;
        marketText += `Open: ${formatCurrency(shData.open)}\n`;
        marketText += `High: ${formatCurrency(shData.high)}\n`;
        marketText += `Low: ${formatCurrency(shData.low)}\n`;
        marketText += `Volume: ${formatNumber(shData.volume)}\n\n`;
        
        marketText += `Shenzhen Component (399001):\n`;
        marketText += `Current: ${formatCurrency(szData.currentPrice)}\n`;
        marketText += `Change: ${formatCurrency(szData.change)} (${szData.changePercent?.toFixed(2) || 0}%)\n`;
        marketText += `Open: ${formatCurrency(szData.open)}\n`;
        marketText += `High: ${formatCurrency(szData.high)}\n`;
        marketText += `Low: ${formatCurrency(szData.low)}\n`;
        marketText += `Volume: ${formatNumber(szData.volume)}\n\n`;
        
        marketText += `ChiNext Index (399006):\n`;
        marketText += `Current: ${formatCurrency(cybData.currentPrice)}\n`;
        marketText += `Change: ${formatCurrency(cybData.change)} (${cybData.changePercent?.toFixed(2) || 0}%)\n`;
        marketText += `Open: ${formatCurrency(cybData.open)}\n`;
        marketText += `High: ${formatCurrency(cybData.high)}\n`;
        marketText += `Low: ${formatCurrency(cybData.low)}\n`;
        marketText += `Volume: ${formatNumber(cybData.volume)}\n\n`;
        
        marketText += `Last Updated: ${formatDateTime(shData.lastUpdated)}\n\n`;
        
        marketText += "=== Market Summary ===\n\n";
        const shChange = shData.changePercent || 0;
        const szChange = szData.changePercent || 0;
        const cybChange = cybData.changePercent || 0;
        
        if (shChange > 0 && szChange > 0 && cybChange > 0) {
            marketText += "Market Sentiment: Bullish (All indices up)\n";
        } else if (shChange < 0 && szChange < 0 && cybChange < 0) {
            marketText += "Market Sentiment: Bearish (All indices down)\n";
        } else {
            marketText += "Market Sentiment: Mixed (Indices showing divergence)\n";
        }
        
        marketText += `\nDate of Analysis: ${new Date().toLocaleDateString()}\n`;
        
        return marketText;
        
    } catch (error) {
        console.error('Error fetching market data:', error);
        return "Error fetching market data. Please try again.";
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadApiConfig();
    loadChatHistory();
});

// Load API configuration from localStorage
function loadApiConfig() {
    const savedConfig = localStorage.getItem('deepseekApiConfig');
    if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Merge with default config for backward compatibility
        apiConfig = {
            provider: parsedConfig.provider || 'deepseek',
            apiKey: parsedConfig.apiKey || '',
            model: parsedConfig.model || 'deepseek-chat',
            baseUrl: parsedConfig.baseUrl || 'https://api.deepseek.com/v1',
            temperature: parsedConfig.temperature || 0.7
        };
    }
}

// Save API configuration to localStorage
function saveApiConfigToStorage() {
    localStorage.setItem('deepseekApiConfig', JSON.stringify(apiConfig));
}

// Open API config modal
function openApiConfigModal() {
    document.getElementById('apiConfigModal').style.display = 'block';

    // Fill in current values
    if (apiConfig.provider) {
        document.getElementById('provider').value = apiConfig.provider;
        updateModelOptions(); // Update models based on provider
    }
    if (apiConfig.apiKey) {
        document.getElementById('apiKey').value = apiConfig.apiKey;
    }
    if (apiConfig.model) {
        document.getElementById('model').value = apiConfig.model;
    }
    if (apiConfig.baseUrl) {
        document.getElementById('baseUrl').value = apiConfig.baseUrl;
    }
    if (apiConfig.temperature) {
        document.getElementById('temperature').value = apiConfig.temperature;
    }
}

// Update model options based on selected provider
function updateModelOptions() {
    const provider = document.getElementById('provider').value;
    const config = providerConfigs[provider];
    const modelSelect = document.getElementById('model');
    const baseUrlInput = document.getElementById('baseUrl');
    const apiKeyHint = document.getElementById('apiKeyHint');

    // Clear existing options
    modelSelect.innerHTML = '';

    // Add new options
    config.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        modelSelect.appendChild(option);
    });

    // Auto-fill base URL
    baseUrlInput.value = config.baseUrl;

    // Update API key hint
    apiKeyHint.innerHTML = `Get your API key from <a href="${config.apiKeyUrl}" target="_blank">${config.name} Platform</a>`;
}

// Close API config modal
function closeApiConfigModal() {
    document.getElementById('apiConfigModal').style.display = 'none';
}

// Save API configuration
function saveApiConfig(event) {
    event.preventDefault();

    apiConfig.provider = document.getElementById('provider').value;
    apiConfig.apiKey = document.getElementById('apiKey').value.trim();
    apiConfig.model = document.getElementById('model').value;
    apiConfig.baseUrl = document.getElementById('baseUrl').value.trim();
    apiConfig.temperature = parseFloat(document.getElementById('temperature').value);

    saveApiConfigToStorage();
    closeApiConfigModal();

    showAlert('API configuration saved successfully!', 'success');
}

// Load chat history from localStorage
function loadChatHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        chatHistory.forEach(msg => {
            if (msg.role !== 'system') {
                appendMessageToUI(msg.role, msg.content, false);
            }
        });
    }
}

// Save chat history to localStorage
function saveChatHistoryToStorage() {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Clear chat
function clearChat() {
    if (confirm('Are you sure you want to clear all messages?')) {
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🤖</div>
                <h2>Welcome to AI Assistant</h2>
                <p>I'm here to help you with investment questions. You can:</p>
                <ul>
                    <li>Ask about stock analysis and market trends</li>
                    <li>Get investment advice and portfolio suggestions</li>
                    <li>Learn about financial concepts and strategies</li>
                    <li>Use the preset templates below for quick queries</li>
                </ul>
                <p class="note">Please configure your DeepSeek API key to get started.</p>
            </div>
        `;
    }
}

// Use prompt template
async function useTemplate(templateKey) {
    const template = promptTemplates[templateKey];
    if (!template) {
        showAlert('Template not found', 'warning');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    
    // Show loading indicator
    showAlert('Loading template data...', 'info');
    
    try {
        let processedTemplate = template;
        
        // For templates that need portfolio data
        if (['portfolio', 'risk', 'strategy'].includes(templateKey)) {
            const portfolioData = await fetchPortfolioForTemplate();
            processedTemplate = template.replace('[PORTFOLIO_DATA_WILL_BE_INSERTED]', portfolioData);
        }
        
        // For market trend template
        if (templateKey === 'market') {
            const marketData = await fetchMarketDataForTemplate();
            processedTemplate = template.replace('[MARKET_DATA_WILL_BE_INSERTED]', marketData);
        }
        
        // For stock analysis, show prompt for ticker
        if (templateKey === 'analysis') {
            const ticker = prompt('Please enter the stock ticker code (e.g., 600519):');
            if (!ticker) {
                return; // User cancelled
            }
            processedTemplate = template.replace('[STOCK TICKER CODE]', ticker.toUpperCase());
        }
        
        messageInput.value = processedTemplate;
        messageInput.focus();
        autoResize(messageInput);
        
    } catch (error) {
        console.error('Error using template:', error);
        showAlert('Error loading template: ' + error.message, 'warning');
    }
}

// Handle key down in message input
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Auto resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        showAlert('Please enter a message', 'warning');
        return;
    }
    
    if (!apiConfig.apiKey) {
        showAlert('Please configure your API key first', 'warning');
        openApiConfigModal();
        return;
    }
    
    if (isTyping) {
        showAlert('Please wait for the response', 'warning');
        return;
    }
    
    // Clear welcome message if it exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    // Add user message to UI and history
    appendMessageToUI('user', message);
    chatHistory.push({
        role: 'user',
        content: message
    });
    saveChatHistoryToStorage();
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Show typing indicator
    isTyping = true;
    showTypingIndicator();
    
    try {
        const response = await callDeepSeekAPI();
        isTyping = false;
        removeTypingIndicator();
        
        // Add assistant response to UI and history
        appendMessageToUI('assistant', response);
        chatHistory.push({
            role: 'assistant',
            content: response
        });
        saveChatHistoryToStorage();
        
    } catch (error) {
        isTyping = false;
        removeTypingIndicator();
        appendMessageToUI('error', `Error: ${error.message}`);
        console.error('Error calling DeepSeek API:', error);
    }
}

// Call DeepSeek API
async function callDeepSeekAPI() {
    const url = `${apiConfig.baseUrl}/chat/completions`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`
        },
        body: JSON.stringify({
            model: apiConfig.model,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert financial advisor and investment assistant with deep knowledge of stock markets, financial analysis, and investment strategies. Provide helpful, accurate, and well-reasoned advice. Always include relevant data and explain your reasoning. Be professional yet approachable in your responses.`
                },
                ...chatHistory
            ],
            temperature: apiConfig.temperature,
            max_tokens: 2000,
            stream: false
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// Append message to UI
function appendMessageToUI(role, content, scroll = true) {
    const messagesContainer = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${role}`;
    
    const avatar = role === 'user' ? '👤' : role === 'error' ? '❌' : '🤖';
    
    // Format content (convert newlines to breaks, bold text, etc.)
    const formattedContent = formatMessageContent(content);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-text">${formattedContent}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    if (scroll) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Format message content
function formatMessageContent(content) {
    // Escape HTML
    let formatted = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Convert **text** to <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *text* to <em>text</em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert `text` to <code>text</code>
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Convert numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<div class="list-item">$&</div>');
    
    // Convert bullet points
    formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<div class="list-item">$&</div>');
    
    return formatted;
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'message message-assistant';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Export functions to window
window.openApiConfigModal = openApiConfigModal;
window.closeApiConfigModal = closeApiConfigModal;
window.saveApiConfig = saveApiConfig;
window.updateModelOptions = updateModelOptions;
window.clearChat = clearChat;
window.useTemplate = useTemplate;
window.handleKeyDown = handleKeyDown;
window.autoResize = autoResize;
window.sendMessage = sendMessage;
