# Portfolio Manager System

A comprehensive portfolio management system integrated with Chinese financial data APIs (Tencent Finance, Sina Finance), real-time charts, historical transaction records, AI-powered analysis, and multi-page dashboard.

## Tech Stack

### Backend
- **Java 25**
- **Spring Boot 3.4.5**
- **Spring Data JPA**
- **MySQL**
- **Lombok**
- **Sina Finance API** (Professional financial data source)

### Frontend
- **HTML5**
- **CSS3** (Modern gradient responsive design)
- **JavaScript (ES6+)**
- **Chart.js** (Data visualization)
- **Marked.js** (Markdown rendering)

## Project Structure

```
finalproject1/
├── src/
│   ├── main/
│   │   ├── java/com/drake/
│   │   │   ├── PortfolioApplication.java      # Spring Boot main class
│   │   │   ├── controller/
│   │   │   │   ├── HoldingController.java    # Holdings API controller
│   │   │   │   ├── StockController.java      # Stock API controller
│   │   │   │   └── TransactionController.java # Transaction API controller
│   │   │   ├── service/
│   │   │   │   ├── HoldingService.java       # Holdings business logic
│   │   │   │   ├── StockService.java         # Stock service
│   │   │   │   └── TransactionService.java   # Transaction business logic
│   │   │   ├── repository/
│   │   │   │   ├── HoldingRepository.java     # Holdings data access
│   │   │   │   └── TransactionRepository.java # Transaction data access
│   │   │   ├── model/
│   │   │   │   ├── Holding.java               # Holding entity
│   │   │   │   └── Transaction.java           # Transaction entity
│   │   │   └── dto/
│   │   │       ├── PortfolioSummary.java      # Portfolio summary
│   │   │       └── StockInfo.java             # Stock information
│   │   └── resources/
│   │       ├── application.properties        # Configuration file
│   │       └── static/
│   │           ├── dashboard.html            # Dashboard page
│   │           ├── holdings.html             # Holdings details page
│   │           ├── transactions.html         # Transaction records page
│   │           ├── search.html               # Stock search page
│   │           ├── ai-assistant.html         # AI assistant page
│   │           ├── style.css                 # Style file
│   │           ├── common.js                 # Common scripts
│   │           ├── dashboard.js              # Dashboard script
│   │           ├── holdings.js               # Holdings script
│   │           ├── transactions.js           # Transaction script
│   │           ├── search.js                 # Search script
│   │           └── ai-assistant.js            # AI assistant script
├── pom.xml                                    # Maven configuration
└── README.md                                  # Project description
```

## Quick Start

### 1. Database Configuration

Configure database connection in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/portfolio_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
```

### 2. Create Database

```bash
mysql -u root -p
```

In MySQL command line:

```sql
CREATE DATABASE IF NOT EXISTS portfolio_db;
```

### 3. Run Backend

```bash
mvn spring-boot:run -Dspring-boot.run.mainClass=com.drake.PortfolioApplication
```

Backend will start at `http://localhost:8080`.

### 4. Access Frontend

Open any page in your browser:

```
http://localhost:8080/dashboard.html    # Dashboard
http://localhost:8080/holdings.html     # Holdings details
http://localhost:8080/transactions.html # Transaction records
http://localhost:8080/search.html       # Stock search
http://localhost:8080/ai-assistant.html # AI Assistant
```

## Features

### 📊 Dashboard
- ✅ Portfolio overview (total value, total cost, total P/L, return rate)
- ✅ Asset type distribution pie chart
- ✅ Holdings proportion pie chart
- ✅ Holdings summary cards
- ✅ Recent transactions list
- ✅ Red-up green-down color scheme (Chinese stock market standard)

### 💼 Holdings Management
- ✅ Holdings list display
- ✅ Add new holdings
- ✅ Edit existing holdings
- ✅ Delete holdings
- ✅ Update current price
- ✅ Statistics by asset type
- ✅ Real-time P/L calculation
- ✅ Cash deposit/withdrawal
- ✅ Transaction volume in lots (1 lot = 100 shares)
- ✅ Transaction date validation (no future dates or holidays)
- ✅ Price field editable
- ✅ Quick sell functionality

### 📝 Transaction Records
- ✅ Transaction history
- ✅ Buy/Sell transactions
- ✅ Auto-update holdings quantity
- ✅ Transaction statistics (total, buy, sell, amount)
- ✅ Filter transactions by holding
- ✅ Filter transactions by date

### 🔍 Stock Search
- ✅ Real-time A-share stock information query (using Sina Finance API, accurate and stable)
- ✅ Stock code and name search
- ✅ Price trend charts (multiple time ranges: 1 month, 3 months, 6 months, 1 year)
- ✅ Detailed stock information display (open price, high price, low price, volume, etc.)
- ✅ Quick add to portfolio
- ✅ Popular A-share quick search (SPDB, Kweichow Moutai, Ping An, PAB, CMB)
- ✅ Support search for all A-share stocks
- ✅ 📊 Stock fundamental and technical analysis (AI-powered)
- ✅ Streaming AI response with real-time analysis display
- ✅ Markdown formatted analysis reports

### 🤖 AI Assistant
- ✅ Multi-AI model support (DeepSeek, Qwen, Kimi, ChatGPT, Doubao, ChatGLM)
- ✅ Streaming AI response
- ✅ Markdown formatted output
- ✅ API configuration management (supports multiple AI providers)
- ✅ Real-time chat interface
- ✅ Stock investment advice
- ✅ Portfolio analysis

## REST API Documentation

### Holdings API

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/holdings` | Get all holdings |
| GET | `/api/holdings/summary` | Get portfolio summary |
| GET | `/api/holdings/{id}` | Get single holding |
| GET | `/api/holdings/type/{type}` | Get holdings by type |
| POST | `/api/holdings` | Create holding |
| PUT | `/api/holdings/{id}` | Update holding |
| PATCH | `/api/holdings/{id}/price` | Update current price |
| DELETE | `/api/holdings/{id}` | Delete holding |
| POST | `/api/holdings/buy` | Buy stock/bond |
| POST | `/api/holdings/sell` | Sell stock/bond |
| GET | `/api/holdings/cash/balance` | Get cash balance |
| POST | `/api/holdings/cash/deposit` | Deposit cash |
| POST | `/api/holdings/cash/withdraw` | Withdraw cash |

### Stock API

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/stocks/{ticker}` | Get stock info (real-time data + 30-day K-line) |
| GET | `/api/stocks/{ticker}/history` | Get stock historical price (supports time range parameters) |
| GET | `/api/stocks/{ticker}/historical-open?date=YYYY-MM-DD` | Get historical open price |
| GET | `/api/stocks/search?query=keyword` | Search stocks (supports code and name fuzzy search) |
| POST | `/api/stocks/update-holding-price` | Update holding price |

### Transaction API

| Method | Path | Function |
|--------|------|----------|
| GET | `/api/transactions` | Get all transactions |
| GET | `/api/transactions/{id}` | Get single transaction |
| GET | `/api/transactions/holding/{holdingId}` | Get holding transactions |
| GET | `/api/transactions/recent` | Get recent transactions |
| POST | `/api/transactions` | Create transaction |
| POST | `/api/transactions/buy` | Create buy transaction |
| POST | `/api/transactions/sell` | Create sell transaction |
| DELETE | `/api/transactions/{id}` | Delete transaction |

## Data Models

### Holding

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Primary key, auto-increment |
| ticker | String | Stock code |
| volume | Integer | Holdings quantity |
| assetType | String | Asset type (STOCK/BOND/CASH) |
| purchasePrice | BigDecimal | Purchase price per unit |
| purchaseDate | LocalDate | Purchase date |
| currentPrice | BigDecimal | Current price |
| lastUpdated | LocalDateTime | Last update time |

### Calculated Fields

| Field | Description |
|-------|-------------|
| totalValue | Total market value = currentPrice × volume |
| totalCost | Total cost = purchasePrice × volume |
| profitLoss | Profit/Loss = totalValue - totalCost |
| profitLossPercentage | Return rate = (P/L / Total Cost) × 100% |

### Transaction

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Primary key, auto-increment |
| holding | Holding | Related holding |
| transactionType | String | Transaction type (BUY/SELL) |
| volume | Integer | Transaction quantity |
| price | BigDecimal | Transaction price |
| transactionDate | LocalDateTime | Transaction time |
| totalAmount | BigDecimal | Total amount |

## UI Design Features

### Modern Design
- Gradient color theme
- Card-based layout
- Responsive design (mobile support)
- Smooth animation effects
- Red-up green-down color scheme (Chinese stock market standard)

### Data Visualization
- Asset distribution pie chart
- Holdings proportion pie chart
- Price trend line chart
- Support for multiple time range switching

### User Experience
- Real-time data updates
- Friendly modal dialogs
- Quick action buttons
- P/L color indicators (red-up green-down)
- Support for A-share stock codes (6-digit numbers, e.g., 600000)
- Smart search suggestions (fuzzy matching by code and name)
- Real-time transaction date validation (text hints, no popups)
- Streaming AI response display

## AI Model Configuration

The system supports the following AI models:

1. **DeepSeek** (Default)
   - Base URL: https://api.deepseek.com
   - Models: deepseek-chat, deepseek-coder

2. **Qwen (Tongyi Qianwen)**
   - Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
   - Models: qwen-turbo, qwen-plus, qwen-max, qwen-coder-turbo, qwen-coder-plus

3. **Kimi (Moonshot)**
   - Base URL: https://api.moonshot.cn/v1
   - Models: moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k

4. **ChatGPT (OpenAI)**
   - Base URL: https://api.openai.com/v1
   - Models: gpt-4, gpt-4-turbo, gpt-3.5-turbo

5. **Doubao (ByteDance)**
   - Base URL: https://ark.cn-beijing.volces.com/api/v3
   - Models: ep-20241101182614-xw6xq, ep-20241101182614-sj2kq

6. **ChatGLM (Zhipu AI)**
   - Base URL: https://open.bigmodel.cn/api/paas/v4
   - Models: glm-4, glm-4-flash, glm-4-plus

Configuration steps:
1. Go to AI Assistant page
2. Click "⚙️ API Configuration" button
3. Select AI provider
4. Enter API Key
5. Select model
6. Save configuration

## Trading Rules

### Transaction Date Restrictions
- ❌ Cannot select future dates
- ❌ Cannot select weekends (Saturday, Sunday)
- ❌ Cannot select Chinese stock market holidays (Spring Festival, Qingming Festival, Labor Day, Dragon Boat Festival, Mid-Autumn Festival, National Day, etc.)
- ✅ Only trading days allowed (Monday to Friday, excluding holidays)

### Transaction Volume Unit
- Transaction volume is in "lots"
- 1 lot = 100 shares
- Input volume will be automatically converted to shares when sent to backend

### Commission Calculation
- Buy: Total Amount = Price × Shares × 1.0002 (0.02% commission)
- Sell: Sale Amount = Price × Shares × 0.9993 (0.07% commission)

## Future Development Plans

- [ ] Integrate WebSocket for real-time price push
- [ ] Add user authentication and authorization
- [ ] Support multiple portfolio management
- [ ] Add more chart types (K-line chart, volume chart)
- [ ] Implement investment suggestions and risk analysis
- [ ] Support data export to Excel/CSV
- [ ] Add portfolio backtesting functionality
- [ ] Implement mobile app
- [ ] Add more AI model support
- [ ] Optimize holiday data management (fetch dynamically from API)

## Technical Highlights

1. **Frontend-Backend Separation Architecture**
2. **RESTful API Design**
3. **JPA ORM Data Persistence**
4. **Sina Finance API Integration** (Professional financial data source, accurate and stable)
5. **Chart.js Data Visualization**
6. **Responsive CSS3 Design**
7. **Modular JavaScript Code**
8. **Complete CRUD Operations**
9. **Real-time P/L Calculation**
10. **Transaction History Tracking**
11. **A-share Stock Code Auto-recognition and Conversion**
12. **Smart Search Functionality** (Fuzzy matching by code and name)
13. **Multi-AI Model Support** (DeepSeek, Qwen, Kimi, ChatGPT, Doubao, ChatGLM)
14. **Streaming AI Response** (Real-time analysis display)
15. **Markdown Formatted Output**
16. **Stock Fundamental and Technical Analysis**
17. **Intelligent Transaction Date Validation** (No future dates or holidays)
18. **Red-up Green-down Color Scheme** (Chinese stock market standard)
19. **Transaction Volume in Lots** (1 lot = 100 shares)
20. **Editable Price Field**

## Notes

1. Sina Finance API can only retrieve up to 1023 K-line data points, which may not be sufficient for long-term historical data
2. Data has delays and is not truly real-time
3. Database connection information should be modified according to the actual environment
4. It is recommended to add HTTPS configuration in production environment
5. Some dependency libraries have known security vulnerabilities and should be updated regularly
6. It is recommended to control request frequency to avoid API rate limiting
7. AI features require configuring the corresponding API Key to use
8. Holiday data is currently hardcoded and needs to be updated regularly
9. AI analysis results are for reference only and do not constitute investment advice

## License

This project is for learning and training purposes only.
