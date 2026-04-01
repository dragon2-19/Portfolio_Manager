// DeepSeek API Configuration
let apiConfig = {
    apiKey: '',
    model: 'deepseek-chat',
    temperature: 0.7,
    baseUrl: 'https://api.deepseek.com/v1'
};

// Chat history
let chatHistory = [];
let isTyping = false;

// Prompt templates
const promptTemplates = {
    analysis: `Please analyze the stock [TICKER] for me. Include:
1. Company overview and business model
2. Financial performance analysis (revenue, profit, growth)
3. Valuation analysis (P/E ratio, market cap)
4. Competitive advantages
5. Risk factors
6. Investment recommendation with reasoning

Please provide a comprehensive analysis with specific data points where possible.`,

    portfolio: `Please review my portfolio and provide:
1. Diversification analysis across different sectors
2. Risk assessment of current holdings
3. Suggestions for rebalancing
4. Areas for potential improvement
5. Overall portfolio health score (1-10)

My current portfolio includes: [LIST YOUR HOLDINGS]`,

    market: `What are the current market trends? Please cover:
1. Overall market sentiment and direction
2. Key sectors performing well or poorly
3. Major economic indicators to watch
4. Upcoming events that might impact markets
5. Investment opportunities in the current environment`,

    risk: `Please help me with risk management by providing:
1. Assessment of my current risk tolerance level
2. Risk factors to consider for my portfolio
3. Strategies to mitigate identified risks
4. Stop-loss and take-profit recommendations
5. Position sizing advice

My risk profile: [CONSERVATIVE/MODERATE/AGGRESSIVE]`,

    strategy: `Based on my financial situation, please suggest an investment strategy:
1. Recommended asset allocation
2. Investment timeframe advice
3. Specific stocks or sectors to focus on
4. Dollar-cost averaging strategy
5. Rebalancing frequency and method

My investment goals: [SHORT-TERM/MEDIUM-TERM/LONG-TERM]`,

    education: `Please explain [FINANCIAL CONCEPT] in simple terms:
1. Definition and basic explanation
2. How it works in practice
3. Real-world examples
4. Pros and cons
5. Common mistakes to avoid
6. Tips for beginners`
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadApiConfig();
    loadChatHistory();
});

// Load API configuration from localStorage
function loadApiConfig() {
    const savedConfig = localStorage.getItem('deepseekApiConfig');
    if (savedConfig) {
        apiConfig = JSON.parse(savedConfig);
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
    if (apiConfig.apiKey) {
        document.getElementById('apiKey').value = apiConfig.apiKey;
    }
    document.getElementById('model').value = apiConfig.model;
    document.getElementById('temperature').value = apiConfig.temperature;
}

// Close API config modal
function closeApiConfigModal() {
    document.getElementById('apiConfigModal').style.display = 'none';
}

// Save API configuration
function saveApiConfig(event) {
    event.preventDefault();
    
    apiConfig.apiKey = document.getElementById('apiKey').value.trim();
    apiConfig.model = document.getElementById('model').value;
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
function useTemplate(templateKey) {
    const template = promptTemplates[templateKey];
    if (template) {
        const messageInput = document.getElementById('messageInput');
        messageInput.value = template;
        messageInput.focus();
        autoResize(messageInput);
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
        showAlert('Please configure your DeepSeek API key first', 'warning');
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
window.clearChat = clearChat;
window.useTemplate = useTemplate;
window.handleKeyDown = handleKeyDown;
window.autoResize = autoResize;
window.sendMessage = sendMessage;
