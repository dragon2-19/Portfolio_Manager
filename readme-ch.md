# 投资组合管理系统 (Portfolio Manager)

一个功能完整的投资组合管理系统，集成国内财经数据API（腾讯财经、新浪财经）、实时图表、历史交易记录、AI智能分析和多页面仪表板。

## 技术栈

### 后端
- **Java 25**
- **Spring Boot 3.4.5**
- **Spring Data JPA**
- **MySQL**
- **Lombok**
- **新浪财经API**（专业财经数据源）

### 前端
- **HTML5**
- **CSS3** (现代化渐变响应式设计)
- **JavaScript (ES6+)**
- **Chart.js** (数据可视化)
- **Marked.js** (Markdown渲染)

## 项目结构

```
finalproject1/
├── src/
│   ├── main/
│   │   ├── java/com/drake/
│   │   │   ├── PortfolioApplication.java      # Spring Boot 主类
│   │   │   ├── controller/
│   │   │   │   ├── HoldingController.java    # 持仓 API 控制器
│   │   │   │   ├── StockController.java      # 股票 API 控制器
│   │   │   │   └── TransactionController.java # 交易 API 控制器
│   │   │   ├── service/
│   │   │   │   ├── HoldingService.java       # 持仓业务逻辑
│   │   │   │   ├── StockService.java         # 股票服务
│   │   │   │   └── TransactionService.java   # 交易业务逻辑
│   │   │   ├── repository/
│   │   │   │   ├── HoldingRepository.java     # 持仓数据访问
│   │   │   │   └── TransactionRepository.java # 交易数据访问
│   │   │   ├── model/
│   │   │   │   ├── Holding.java               # 持仓实体
│   │   │   │   └── Transaction.java           # 交易实体
│   │   │   └── dto/
│   │   │       ├── PortfolioSummary.java      # 投资组合摘要
│   │   │       └── StockInfo.java             # 股票信息
│   │   └── resources/
│   │       ├── application.properties        # 配置文件
│   │       └── static/
│   │           ├── dashboard.html            # 仪表板页面
│   │           ├── holdings.html             # 持仓详情页面
│   │           ├── transactions.html         # 交易记录页面
│   │           ├── search.html               # 股票搜索页面
│   │           ├── ai-assistant.html         # AI助手页面
│   │           ├── style.css                 # 样式文件
│   │           ├── common.js                 # 公共脚本
│   │           ├── dashboard.js              # 仪表板脚本
│   │           ├── holdings.js               # 持仓脚本
│   │           ├── transactions.js           # 交易脚本
│   │           ├── search.js                 # 搜索脚本
│   │           └── ai-assistant.js            # AI助手脚本
├── pom.xml                                    # Maven 配置
└── README.md                                  # 项目说明
```

## 快速开始

### 1. 数据库配置

在 `src/main/resources/application.properties` 中配置数据库连接：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/portfolio_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
```

### 2. 创建数据库

```bash
mysql -u root -p
```

在 MySQL 命令行中：

```sql
CREATE DATABASE IF NOT EXISTS portfolio_db;
```

### 3. 运行后端

```bash
mvn spring-boot:run -Dspring-boot.run.mainClass=com.drake.PortfolioApplication
```

后端将在 `http://localhost:8080` 启动。

### 4. 访问前端

在浏览器中打开任意页面：

```
http://localhost:8080/dashboard.html    # 仪表板
http://localhost:8080/holdings.html     # 持仓详情
http://localhost:8080/transactions.html # 交易记录
http://localhost:8080/search.html       # 股票搜索
http://localhost:8080/ai-assistant.html # AI助手
```

## 功能特性

### 📊 仪表板 (Dashboard)
- ✅ 投资组合总览（总市值、总成本、总盈亏、收益率）
- ✅ 资产类型分布饼图
- ✅ 持仓占比饼图
- ✅ 持仓概览卡片
- ✅ 最近交易列表
- ✅ 红涨绿跌配色（中国股市标准）

### 💼 持仓管理 (Holdings)
- ✅ 持仓列表展示
- ✅ 添加新持仓
- ✅ 编辑现有持仓
- ✅ 删除持仓
- ✅ 更新当前价格
- ✅ 按资产类型统计
- ✅ 盈亏实时计算
- ✅ 现金充值/提现
- ✅ 交易量单位为手（1手=100股）
- ✅ 交易日期验证（禁止未来日期和节假日）
- ✅ 价格字段可编辑
- ✅ 快速卖出功能

### 📝 交易记录 (Transactions)
- ✅ 交易历史记录
- ✅ 买入/卖出交易
- ✅ 自动更新持仓数量
- ✅ 交易统计（总数、买入、卖出、总额）
- ✅ 按持仓筛选交易
- ✅ 按日期筛选交易

### 🔍 股票搜索 (Stock Search)
- ✅ 实时A股股票信息查询（使用新浪财经API，数据准确稳定）
- ✅ 股票代码和名称搜索
- ✅ 价格走势图（支持多时间范围：1月、3月、6月、1年）
- ✅ 股票详细信息展示（开盘价、最高价、最低价、成交量等）
- ✅ 快速添加到投资组合
- ✅ 热门A股快捷搜索（浦发银行、贵州茅台、中国平安、平安银行、招商银行）
- ✅ 支持全部A股股票搜索
- ✅ 📊 股票基本面和技术分析（AI驱动）
- ✅ 流式AI响应，实时展示分析结果
- ✅ Markdown格式化分析报告

### 🤖 AI助手 (AI Assistant)
- ✅ 多AI模型支持（DeepSeek、Qwen、Kimi、ChatGPT、Doubao、ChatGLM）
- ✅ 流式AI响应
- ✅ Markdown格式化输出
- ✅ API配置管理（支持多个AI提供商）
- ✅ 实时对话界面
- ✅ 股票投资建议
- ✅ 投资组合分析

## REST API 文档

### 持仓 API

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/holdings` | 获取所有持仓 |
| GET | `/api/holdings/summary` | 获取投资组合总览 |
| GET | `/api/holdings/{id}` | 获取单个持仓 |
| GET | `/api/holdings/type/{type}` | 按类型获取持仓 |
| POST | `/api/holdings` | 创建持仓 |
| PUT | `/api/holdings/{id}` | 更新持仓 |
| PATCH | `/api/holdings/{id}/price` | 更新当前价格 |
| DELETE | `/api/holdings/{id}` | 删除持仓 |
| POST | `/api/holdings/buy` | 买入股票/债券 |
| POST | `/api/holdings/sell` | 卖出股票/债券 |
| GET | `/api/holdings/cash/balance` | 获取现金余额 |
| POST | `/api/holdings/cash/deposit` | 充值现金 |
| POST | `/api/holdings/cash/withdraw` | 提取现金 |

### 股票 API

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/stocks/{ticker}` | 获取股票信息（实时数据+30天K线） |
| GET | `/api/stocks/{ticker}/history` | 获取股票历史价格（支持时间范围参数） |
| GET | `/api/stocks/{ticker}/historical-open?date=YYYY-MM-DD` | 获取历史开盘价 |
| GET | `/api/stocks/search?query=关键词` | 搜索股票（支持代码和名称模糊搜索） |
| POST | `/api/stocks/update-holding-price` | 更新持仓价格 |

### 交易 API

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/transactions` | 获取所有交易 |
| GET | `/api/transactions/{id}` | 获取单个交易 |
| GET | `/api/transactions/holding/{holdingId}` | 获取持仓交易 |
| GET | `/api/transactions/recent` | 获取最近交易 |
| POST | `/api/transactions` | 创建交易 |
| POST | `/api/transactions/buy` | 创建买入交易 |
| POST | `/api/transactions/sell` | 创建卖出交易 |
| DELETE | `/api/transactions/{id}` | 删除交易 |

## 数据模型

### Holding（持仓）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键，自增 |
| ticker | String | 股票代码 |
| volume | Integer | 持有数量 |
| assetType | String | 资产类型（STOCK/BOND/CASH） |
| purchasePrice | BigDecimal | 买入单价 |
| purchaseDate | LocalDate | 买入日期 |
| currentPrice | BigDecimal | 当前价格 |
| lastUpdated | LocalDateTime | 最后更新时间 |

### 计算字段

| 字段 | 说明 |
|------|------|
| totalValue | 总市值 = currentPrice × volume |
| totalCost | 总成本 = purchasePrice × volume |
| profitLoss | 盈亏 = totalValue - totalCost |
| profitLossPercentage | 收益率 = (盈亏 / 总成本) × 100% |

### Transaction（交易）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键，自增 |
| holding | Holding | 关联持仓 |
| transactionType | String | 交易类型（BUY/SELL） |
| volume | Integer | 交易数量 |
| price | BigDecimal | 交易价格 |
| transactionDate | LocalDateTime | 交易时间 |
| totalAmount | BigDecimal | 总金额 |

## UI 设计特点

### 现代化设计
- 渐变色主题
- 卡片式布局
- 响应式设计（支持移动端）
- 流畅的动画效果
- 红涨绿跌配色（中国股市标准）

### 数据可视化
- 资产分布饼图
- 持仓占比饼图
- 价格走势折线图
- 支持多时间范围切换

### 交互体验
- 实时数据更新
- 友好的模态框
- 快捷操作按钮
- 盈亏颜色标识（红涨绿跌）
- 支持A股股票代码（6位数字，如：600000）
- 智能搜索提示（支持代码和名称模糊匹配）
- 交易日期实时验证（文本提示，非弹窗）
- 流式AI响应展示

## AI 模型配置

系统支持以下AI模型：

1. **DeepSeek**（默认）
   - Base URL: https://api.deepseek.com
   - Models: deepseek-chat, deepseek-coder

2. **Qwen (通义千问)**
   - Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
   - Models: qwen-turbo, qwen-plus, qwen-max, qwen-coder-turbo, qwen-coder-plus

3. **Kimi (Moonshot)**
   - Base URL: https://api.moonshot.cn/v1
   - Models: moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k

4. **ChatGPT (OpenAI)**
   - Base URL: https://api.openai.com/v1
   - Models: gpt-4, gpt-4-turbo, gpt-3.5-turbo

5. **Doubao (字节跳动)**
   - Base URL: https://ark.cn-beijing.volces.com/api/v3
   - Models: ep-20241101182614-xw6xq, ep-20241101182614-sj2kq

6. **ChatGLM (智谱AI)**
   - Base URL: https://open.bigmodel.cn/api/paas/v4
   - Models: glm-4, glm-4-flash, glm-4-plus

配置方法：
1. 进入AI Assistant页面
2. 点击"⚙️ API Configuration"按钮
3. 选择AI提供商
4. 输入API Key
5. 选择模型
6. 保存配置

## 交易规则

### 交易日期限制
- ❌ 不能选择未来日期
- ❌ 不能选择周末（周六、周日）
- ❌ 不能选择中国股市节假日（春节、清明节、劳动节、端午节、中秋节、国庆节等）
- ✅ 只能选择交易日（周一至周五，非节假日）

### 交易量单位
- 交易量以"手"为单位
- 1手 = 100股
- 输入的交易量会自动转换为股数发送到后端

### 手续费计算
- 买入：总金额 = 价格 × 股数 × 1.0002（手续费0.02%）
- 卖出：卖出金额 = 价格 × 股数 × 0.9993（手续费0.07%）

## 后续开发计划

- [ ] 集成 WebSocket 实现实时价格推送
- [ ] 添加用户认证和授权
- [ ] 支持多投资组合管理
- [ ] 添加更多图表类型（K线图、成交量图）
- [ ] 实现投资建议和风险分析
- [ ] 支持数据导出为 Excel/CSV
- [ ] 添加投资组合回测功能
- [ ] 实现移动端 App
- [ ] 添加更多AI模型支持
- [ ] 优化节假日数据管理（从API动态获取）

## 技术亮点

1. **前后端分离架构**
2. **RESTful API 设计**
3. **JPA ORM 数据持久化**
4. **新浪财经API集成**（专业财经数据源，准确稳定）
5. **Chart.js 数据可视化**
6. **响应式 CSS3 设计**
7. **模块化 JavaScript 代码**
8. **完整的 CRUD 操作**
9. **实时盈亏计算**
10. **交易历史追踪**
11. **A股股票代码自动识别和转换**
12. **智能搜索功能**（支持代码和名称模糊匹配）
13. **AI多模型支持**（DeepSeek、Qwen、Kimi、ChatGPT、Doubao、ChatGLM）
14. **流式AI响应**（实时展示分析结果）
15. **Markdown格式化输出**
16. **股票基本面和技术分析**
17. **交易日期智能验证**（禁止未来日期和节假日）
18. **红涨绿跌配色**（中国股市标准）
19. **交易量手数单位**（1手=100股）
20. **价格字段可编辑**

## 注意事项

1. 新浪财经API最多只能获取最近1023个K线数据节点，对于长期历史数据可能不够
2. 数据有延迟，不是真正的实时数据
3. 数据库连接信息请根据实际环境修改
4. 建议在生产环境中添加 HTTPS 配置
5. 部分依赖库存在已知安全漏洞，建议定期更新
6. 建议控制请求频率，避免被API限流
7. AI功能需要配置相应的API Key才能使用
8. 节假日数据目前为硬编码，需要定期更新
9. AI分析结果仅供参考，不构成投资建议

## 许可证

本项目仅用于学习和培训目的。
