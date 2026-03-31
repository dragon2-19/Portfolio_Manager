# Portfolio Manager - 系统架构框架图

## 一、整体业务架构框架

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          用户界面层 (User Interface)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ dashboard    │  │ holdings     │  │ transactions │  │   search     │ │
│  │ .html        │  │ .html        │  │ .html        │  │   .html      │ │
│  │ +dashboard.js│  │ +holdings.js │  │ +transactions│  │  +search.js  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                            ↕ HTTP/REST API                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                        API 网关层 (API Gateway Layer)                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    REST Controllers                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   │
│  │  │ HoldingController│  │TransactionControl│  │ StockController│  │   │
│  │  │ /api/holdings    │  │/api/transactions │  │ /api/stocks    │  │   │
│  │  │ - GET /          │  │ - GET /          │  │ - GET /{ticker}│  │   │
│  │  │ - GET /summary   │  │ - POST /buy      │  │ - GET /history │  │   │
│  │  │ - GET /{id}      │  │ - POST /sell     │  │ - GET /search  │  │   │
│  │  │ - POST /         │  │ - DELETE /{id}   │  │ - POST /update │  │   │
│  │  │ - PUT /{id}      │  │                  │  │                │  │   │
│  │  │ - DELETE /{id}   │  │                  │  │                │  │   │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                      业务逻辑层 (Business Logic Layer)                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      @Service Components                          │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │              HoldingService                                │  │   │
│  │  │  - getAllHoldings()                                        │  │   │
│  │  │  - getPortfolioSummary() ← 核心业务计算                     │  │   │
│  │  │  - createHolding()                                         │  │   │
│  │  │  - updateHolding()                                         │  │   │
│  │  │  - calculateProfitLoss()                                   │  │   │
│  │  │  - getTotalValue()                                         │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │            TransactionService                              │  │   │
│  │  │  - createBuyTransaction()                                  │  │   │
│  │  │  - createSellTransaction()                                 │  │   │
│  │  │  - validateInventory()                                     │  │   │
│  │  │  - updateHoldingVolume()                                   │  │   │
│  │  │  - getRecentTransactions()                                 │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │               StockService                                 │  │   │
│  │  │  - getStockInfo()                                          │  │   │
│  │  │  - fetchFromSinaAPI()                                      │  │   │
│  │  │  - getKlineData()                                          │  │   │
│  │  │  - searchStocks()                                          │  │   │
│  │  │  - convertTickerCode()                                     │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                      数据访问层 (Data Access Layer)                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Spring Data JPA Repositories                        │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────┐    ┌──────────────────────────┐   │   │
│  │  │   HoldingRepository      │    │  TransactionRepository   │   │   │
│  │  │  extends JpaRepository   │    │  extends JpaRepository   │   │   │
│  │  │                          │    │                          │   │   │
│  │  │  - findByAssetType()     │    │  - findByHoldingId()     │   │   │
│  │  │  - findByTicker()        │    │  - findByType()          │   │   │
│  │  │  - getTotalVolume()      │    │  - findAfterDate()       │   │   │
│  │  │  - countByType()         │    │  - countByHolding()      │   │   │
│  │  └──────────────────────────┘    └──────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                        数据存储层 (Data Storage)                          │
│                    ┌────────────────────────┐                           │
│                    │   MySQL Database       │                           │
│                    │   portfolio_db         │                           │
│                    │                        │                           │
│                    │  ┌──────────────────┐  │                           │
│                    │  │ holding 表       │  │                           │
│                    │  │ - id             │  │                           │
│                    │  │ - ticker         │  │                           │
│                    │  │ - volume         │  │                           │
│                    │  │ - asset_type     │  │                           │
│                    │  │ - purchase_price │  │                           │
│                    │  │ - current_price  │  │                           │
│                    │  └──────────────────┘  │                           │
│                    │                        │                           │
│                    │  ┌──────────────────┐  │                           │
│                    │  │ transaction 表    │  │                           │
│                    │  │ - id             │  │                           │
│                    │  │ - holding_id(FK) │  │                           │
│                    │  │ - type           │  │                           │
│                    │  │ - volume         │  │                           │
│                    │  │ - price          │  │                           │
│                    │  └──────────────────┘  │                           │
│                    └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                      外部服务层 (External Services)                       │
│  ┌────────────────────────────────┐   ┌────────────────────────────┐   │
│  │   新浪财经实时行情 API          │   │   新浪财经 K 线历史数据 API     │   │
│  │   http://hq.sinajs.cn         │   │  money.finance.sina.com.cn │   │
│  │                                │   │                            │   │
│  │  - 实时股价                    │   │  - 日 K 线数据                │   │
│  │  - 开盘价/收盘价               │   │  - 历史价格趋势             │   │
│  │  - 成交量/成交额               │   │  - 支持自定义时间范围       │   │
│  └────────────────────────────────┘   └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、技术栈分层框架

```
┌─────────────────────────────────────────────────────────────────────────┐
│  前端技术栈 (Frontend Stack)                                             │
│  ├─ HTML5          (页面结构)                                            │
│  ├─ CSS3           (样式设计 - style.css)                                │
│  ├─ JavaScript ES6 (业务逻辑)                                           │
│  ├─ Chart.js       (图表可视化)                                         │
│  └─ Fetch API      (HTTP 请求)                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│  Web 服务层 (Web Tier)                                                   │
│  ├─ Spring Boot 3.4.5       (主框架)                                    │
│  ├─ Spring Web MVC          (Web 框架)                                   │
│  ├─ Embedded Tomcat         (应用容器 - Port 8080)                       │
│  └─ Jackson                 (JSON 序列化)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│  业务层 (Business Tier)                                                  │
│  ├─ Spring Framework Core   (依赖注入 IOC)                              │
│  ├─ Spring Annotations      (@Service, @Autowired)                      │
│  └─ Business Logic          (盈亏计算、交易验证)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│  持久化层 (Persistence Tier)                                             │
│  ├─ Spring Data JPA         (数据访问框架)                              │
│  ├─ Hibernate 6.x          (ORM 框架)                                   │
│  ├─ JPA Annotations        (@Entity, @Table, @Column)                  │
│  └─ Connection Pool        (数据库连接池)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│  数据库层 (Database Tier)                                                │
│  ├─ MySQL 8.0+             (关系型数据库)                               │
│  ├─ JDBC Driver            (com.mysql.cj.jdbc.Driver)                  │
│  └─ Database Schema        (portfolio_db)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│  集成层 (Integration Tier)                                               │
│  ├─ RestTemplate           (Spring HTTP 客户端)                          │
│  ├─ Apache HttpClient 5    (第三方 HTTP 库)                              │
│  └─ JSON Parser            (数据解析)                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│  开发工具与运行时 (Dev Tools & Runtime)                                  │
│  ├─ Java 25                (JDK 版本)                                    │
│  ├─ Maven                  (构建工具 - pom.xml)                         │
│  ├─ Lombok                 (代码简化 - @Data)                           │
│  └─ Spring Boot Plugin     (打包插件)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 三、核心业务流程框架

### 3.1 持仓管理业务流程

```
用户操作
    │
    ├─→ [查看持仓列表]
    │       │
    │       ├─→ GET /api/holdings
    │       │       │
    │       │       ├─→ HoldingController.getAllHoldings()
    │       │       │       │
    │       │       │       └─→ HoldingService.getAllHoldings()
    │       │       │               │
    │       │       │               └─→ holdingRepository.findAll()
    │       │       │                       │
    │       │       │                       └─→ SELECT * FROM holding
    │       │       │
    │       │       └─→ 返回 List<Holding>
    │       │
    │       └─→ 前端渲染持仓表格
    │
    ├─→ [查看组合汇总]
    │       │
    │       ├─→ GET /api/holdings/summary
    │       │       │
    │       │       ├─→ HoldingController.getPortfolioSummary()
    │       │       │       │
    │       │       │       └─→ HoldingService.getPortfolioSummary()
    │       │       │               │
    │       │       │               ├─→ 获取所有持仓
    │       │       │               ├─→ 计算总价值 = Σ(currentPrice × volume)
    │       │       │               ├─→ 计算总成本 = Σ(purchasePrice × volume)
    │       │       │               ├─→ 计算盈亏 = totalValue - totalCost
    │       │       │               ├─→ 计算盈亏比例 = (profitLoss / totalCost) × 100%
    │       │       │               └─→ 统计各资产类型数量
    │       │       │
    │       │       └─→ 返回 PortfolioSummary DTO
    │       │
    │       └─→ 前端展示组合仪表盘
    │
    ├─→ [买入股票]
    │       │
    │       ├─→ POST /api/transactions/buy?holdingId=1&volume=100&price=50.5
    │       │       │
    │       │       ├─→ TransactionController.createBuyTransaction()
    │       │       │       │
    │       │       │       └─→ TransactionService.createBuyTransaction()
    │       │       │               │
    │       │       │               ├─→ 查找持仓 holdingRepository.findById()
    │       │       │               ├─→ 创建交易记录 (type=BUY)
    │       │       │               ├─→ 更新持仓数量 volume += 100
    │       │       │               ├─→ 保存交易 transactionRepository.save()
    │       │       │               └─→ 保存持仓 holdingRepository.save()
    │       │       │
    │       │       └─→ 返回 Transaction 对象
    │       │
    │       └─→ 刷新持仓和交易列表
    │
    └─→ [卖出股票]
            │
            ├─→ POST /api/transactions/sell?holdingId=1&volume=50&price=52.0
            │       │
            │       ├─→ TransactionController.createSellTransaction()
            │       │       │
            │       │       └─→ TransactionService.createSellTransaction()
            │       │               │
            │       │               ├─→ 查找持仓
            │       │               ├─→ 验证库存 volume >= 50 ? ✓ : ✗
            │       │               ├─→ 创建交易记录 (type=SELL)
            │       │               ├─→ 更新持仓数量 volume -= 50
            │       │               └─→ 保存交易和持仓
            │       │
            │       └─→ 返回 Transaction 对象
            │
            └─→ 刷新显示
```

### 3.2 股票行情获取流程

```
用户搜索股票
    │
    ├─→ GET /api/stocks/search?query=茅台
    │       │
    │       ├─→ StockController.searchStocks()
    │       │       │
    │       │       └─→ StockService.searchStocks()
    │       │               │
    │       │               ├─→ 遍历预定义 A 股列表
    │       │               ├─→ 匹配代码或名称
    │       │               └─→ 调用 getStockInfo() 获取详情
    │       │
    │       └─→ 返回 List<StockInfo>
    │
    └─→ 前端展示搜索结果

用户查看股票详情
    │
    ├─→ GET /api/stocks/600519
    │       │
    │       ├─→ StockController.getStockInfo()
    │       │       │
    │       │       └─→ StockService.getStockInfo("600519")
    │       │               │
    │       │               ├─→ 转换为新浪代码 sh600519
    │       │               ├─→ 调用新浪财经 API
    │       │               │   http://hq.sinajs.cn/list=sh600519
    │       │               │       │
    │       │               │       ├─→ RestTemplate 发送 HTTP GET
    │       │               │       └─→ 返回 var hq_str_sh600519="..."
    │       │               │
    │       │               ├─→ 解析响应数据
    │       │               │   - 股票名称：贵州茅台
    │       │               │   - 当前价格：parseBigDecimal()
    │       │               │   - 开盘价/最高/最低
    │       │               │   - 成交量
    │       │               │   - 计算涨跌幅
    │       │               │
    │       │               ├─→ 获取 K 线历史数据
    │       │               │   http://money.finance.sina.com.cn/...
    │       │               │       │
    │       │               │       ├─→ 请求日 K 线数据 (scale=240)
    │       │               │       └─→ 返回 JSON 数组 [{day,open,high,low,close,volume}]
    │       │               │
    │       │               ├─→ 解析 K 线数据
    │       │               │   └─→ 提取日期和收盘价
    │       │               │
    │       │               └─→ 组装 StockInfo 对象
    │       │
    │       └─→ 返回 StockInfo(JSON)
    │
    └─→ 前端 Chart.js 绘制 K 线图
```

---

## 四、数据模型关系框架

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         实体关系图 (ER Diagram)                          │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────┐
    │        Holding 实体          │
    │                             │
    │  PK: id (BIGINT)            │
    │      ticker (VARCHAR)       │
    │      volume (INT)           │
    │      assetType (VARCHAR)    │
    │      purchasePrice (DECIMAL)│
    │      currentPrice (DECIMAL) │
    │      purchaseDate (DATE)    │
    │      lastUpdated (DATETIME) │
    │                             │
    │  Methods:                   │
    │  + getTotalValue()          │
    │  + getTotalCost()           │
    │  + getProfitLoss()          │
    │  + getProfitLossPercentage()│
    └─────────────────────────────┘
                │
                │ 一对多 (1:N)
                │ @OneToMany(mappedBy="holding")
                │
                ▼
    ┌─────────────────────────────┐
    │      Transaction 实体        │
    │                             │
    │  PK: id (BIGINT)            │
    │  FK: holding_id (BIGINT)    │
    │      transactionType(VARCHAR│
    │      volume (INT)           │
    │      price (DECIMAL)        │
    │      transactionDate(DATETIME│
    │      totalAmount (DECIMAL)  │
    │                             │
    │  Relationships:             │
    │  @ManyToOne(fetch=LAZY)     │
    │  @JoinColumn(name="holding")│
    └─────────────────────────────┘


数据流向示例:

查询持仓及关联交易:
    
    Holding (id=1, ticker="600519", volume=1000)
         │
         │ 懒加载 (Lazy Loading)
         │ 触发：transactionRepository.findByHoldingId(1)
         ▼
    List<Transaction>:
    ├─ Transaction(id=1, type="BUY", volume=500, price=1800.00)
    ├─ Transaction(id=2, type="BUY", volume=500, price=1850.00)
    └─ Transaction(id=3, type="SELL", volume=200, price=1900.00)
```

---

## 五、DTO 数据传输框架

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DTO (Data Transfer Objects)                         │
└─────────────────────────────────────────────────────────────────────────┘

1. PortfolioSummary (投资组合汇总)
   
   用途：聚合多个 Holding 的统计数据
   
   字段:
   ┌──────────────────────────────┬──────────┬─────────────────────┐
   │ 字段名                       │ 类型     │ 说明                │
   ├──────────────────────────────┼──────────┼─────────────────────┤
   │ totalHoldings                │ Long     │ 持仓总数            │
   │ totalValue                   │ BigDecimal│ 总价值             │
   │ totalCost                    │ BigDecimal│ 总成本             │
   │ totalProfitLoss              │ BigDecimal│ 总盈亏金额         │
   │ totalProfitLossPercentage    │ BigDecimal│ 总盈亏百分比       │
   │ stockCount                   │ Long     │ 股票持仓数量        │
   │ bondCount                    │ Long     │ 债券持仓数量        │
   │ cashCount                    │ Long     │ 现金持仓数量        │
   └──────────────────────────────┴──────────┴─────────────────────┘
   
   数据来源:
   Service 层计算 → Controller 返回 → 前端展示


2. StockInfo (股票信息)
   
   用途：封装从外部 API 获取的股票数据
   
   字段:
   ┌──────────────────────────────┬──────────┬─────────────────────┐
   │ 字段名                       │ 类型     │ 说明                │
   ├──────────────────────────────┼──────────┼─────────────────────┤
   │ ticker                       │ String   │ 股票代码            │
   │ name                         │ String   │ 股票名称            │
   │ currentPrice                 │ BigDecimal│ 当前价格           │
   │ change                       │ BigDecimal│ 涨跌额             │
   │ changePercent                │ BigDecimal│ 涨跌幅 (%)          │
   │ open                         │ BigDecimal│ 开盘价             │
   │ high                         │ BigDecimal│ 最高价             │
   │ low                          │ BigDecimal│ 最低价             │
   │ volume                       │ Long     │ 成交量 (股)          │
   │ marketCap                    │ BigDecimal│ 市值               │
   │ lastUpdated                  │ LocalDateTime│ 最后更新时间    │
   │ priceHistory                 │ List<PriceHistoryPoint>│ K 线数据│
   └──────────────────────────────┴──────────┴─────────────────────┘
   
   内部类 PriceHistoryPoint:
   ┌──────────────────────────────┬──────────┬─────────────────────┐
   │ date                         │ String   │ 日期 (YYYY-MM-DD)   │
   │ price                        │ BigDecimal│ 收盘价             │
   └──────────────────────────────┴──────────┴─────────────────────┘
   
   数据流:
   新浪财经 API → StockService 解析 → StockInfo → Controller → 前端
```

---

## 六、API 接口完整框架

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESTful API 接口清单                              │
└─────────────────────────────────────────────────────────────────────────┘

【持仓管理模块】/api/holdings
┌────┬──────────────────────────┬──────────────────────────┬──────────────┐
│方法 │ URL 路径                  │ Controller 方法           │ 功能描述     │
├────┼──────────────────────────┼──────────────────────────┼──────────────┤
│GET │ /api/holdings            │ getAllHoldings()         │ 获取所有持仓 │
│GET │ /api/holdings/summary    │ getPortfolioSummary()    │ 组合汇总统计 │
│GET │ /api/holdings/{id}       │ getHoldingById(id)       │ 获取单个持仓 │
│GET │ /api/holdings/type/{type}│ getHoldingsByType(type)  │ 按类型筛选   │
│POST│ /api/holdings            │ createHolding(holding)   │ 创建新持仓   │
│PUT │ /api/holdings/{id}       │ updateHolding(id,h)      │ 更新持仓信息 │
│PATCH│/api/holdings/{id}/price  │ updateCurrentPrice(id,p) │ 更新当前价格 │
│DEL │ /api/holdings/{id}       │ deleteHolding(id)        │ 删除持仓     │
└────┴──────────────────────────┴──────────────────────────┴──────────────┘

【交易管理模块】/api/transactions
┌────┬──────────────────────────┬──────────────────────────┬──────────────┐
│方法 │ URL 路径                  │ Controller 方法           │ 功能描述     │
├────┼──────────────────────────┼──────────────────────────┼──────────────┤
│GET │ /api/transactions        │ getAllTransactions()     │ 获取所有交易 │
│GET │ /api/transactions/{id}   │ getTransactionById(id)   │ 获取单条交易 │
│GET │ /api/transactions/holding│ getTransactionsByHolding │ 按持仓查询   │
│POST│ /api/transactions        │ createTransaction(t)     │ 创建交易记录 │
│POST│ /api/transactions/buy    │ createBuyTransaction()   │ 买入操作     │
│POST│ /api/transactions/sell   │ createSellTransaction()  │ 卖出操作     │
│DEL │ /api/transactions/{id}   │ deleteTransaction(id)    │ 删除交易     │
│GET │ /api/transactions/recent │ getRecentTransactions()  │ 近期交易     │
└────┴──────────────────────────┴──────────────────────────┴──────────────┘

【股票行情模块】/api/stocks
┌────┬──────────────────────────┬──────────────────────────┬──────────────┐
│方法 │ URL 路径                  │ Controller 方法           │ 功能描述     │
├────┼──────────────────────────┼──────────────────────────┼──────────────┤
│GET │ /api/stocks/{ticker}     │ getStockInfo(ticker)     │ 获取股票信息 │
│GET │ /api/stocks/{ticker}/hist│ getStockHistory(t,r)     │ 获取历史 K 线  │
│GET │ /api/stocks/search       │ searchStocks(query)      │ 搜索股票     │
│POST│ /api/stocks/update-holding│updateHoldingPrice(h,t)  │ 更新持仓价格 │
└────┴──────────────────────────┴──────────────────────────┴──────────────┘

跨域配置: @CrossOrigin(origins = "*") - 允许所有来源访问
```

---

## 七、配置文件框架

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      application.properties 配置                          │
└─────────────────────────────────────────────────────────────────────────┘

# ════════════════════════════════════════════════════════════════════════
# 服务器配置
# ════════════════════════════════════════════════════════════════════════
server.port=8080                    # Web 服务端口

# ════════════════════════════════════════════════════════════════════════
# 数据库配置
# ════════════════════════════════════════════════════════════════════════
spring.datasource.url=jdbc:mysql://localhost:3306/portfolio_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=forina   # 数据库用户名
spring.datasource.password=zq357896214  # 数据库密码
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# ════════════════════════════════════════════════════════════════════════
# JPA/Hibernate 配置
# ════════════════════════════════════════════════════════════════════════
spring.jpa.hibernate.ddl-auto=validate  # 自动验证表结构
spring.jpa.show-sql=true                # 控制台显示 SQL
spring.jpa.properties.hibernate.format_sql=true  # 格式化 SQL
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.transaction.jta.platform=none

# ════════════════════════════════════════════════════════════════════════
# Maven 依赖管理 (pom.xml 摘要)
# ════════════════════════════════════════════════════════════════════════

parent: spring-boot-starter-parent (3.4.5)

核心依赖:
├─ spring-boot-starter-web          # Web 开发支持
├─ spring-boot-starter-data-jpa     # JPA 数据访问
├─ mysql-connector-j                # MySQL 驱动
├─ lombok                           # 代码简化 (@Data)
├─ httpclient5                      # HTTP 客户端
└─ jackson-databind                 # JSON 处理

Java 版本：25
构建工具：Maven
打包方式：可执行 JAR
```

---

## 八、项目目录结构框架

```
Portfolio_Manager/
│
├── src/main/
│   ├── java/com/drake/
│   │   ├── controller/              # 控制器层
│   │   │   ├── HoldingController.java
│   │   │   ├── StockController.java
│   │   │   └── TransactionController.java
│   │   │
│   │   ├── service/                 # 业务逻辑层
│   │   │   ├── HoldingService.java
│   │   │   ├── StockService.java
│   │   │   └── TransactionService.java
│   │   │
│   │   ├── repository/              # 数据访问层
│   │   │   ├── HoldingRepository.java
│   │   │   └── TransactionRepository.java
│   │   │
│   │   ├── model/                   # 实体模型
│   │   │   ├── Holding.java
│   │   │   └── Transaction.java
│   │   │
│   │   ├── dto/                     # 数据传输对象
│   │   │   ├── PortfolioSummary.java
│   │   │   └── StockInfo.java
│   │   │
│   │   ├── Main.java                # 主启动类
│   │   └── PortfolioApplication.java
│   │
│   └── resources/
│       ├── application.properties   # 配置文件
│       └── static/                  # 静态资源
│           ├── dashboard.html       # 仪表盘页面
│           ├── dashboard.js
│           ├── holdings.html        # 持仓管理页面
│           ├── holdings.js
│           ├── transactions.html    # 交易管理页面
│           ├── transactions.js
│           ├── search.html          # 股票搜索页面
│           ├── search.js
│           └── style.css            # 样式文件
│
├── pom.xml                          # Maven 配置
├── README.md                        # 项目说明
├── problem.md                       # 问题描述
└── project.md                       # 项目文档
```

---

## 九、系统运行流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        系统启动流程                                      │
└─────────────────────────────────────────────────────────────────────────┘

1. JVM 启动 (Java 25)
        │
        ▼
2. Spring Boot Application.main()
        │
        ├─→ 加载 application.properties
        │       ├─ 读取数据库配置
        │       └─ 读取 JPA 配置
        │
        ├─→ 初始化 Spring 容器 (ApplicationContext)
        │       ├─ 扫描@Component, @Service, @Repository
        │       ├─ 创建 Bean 实例
        │       └─ 注入依赖 (@Autowired)
        │
        ├─→ 配置嵌入式 Tomcat
        │       └─ 绑定端口 8080
        │
        ├─→ 建立数据库连接
        │       ├─ 加载 MySQL 驱动
        │       ├─ 连接 localhost:3306
        │       └─ 验证表结构 (ddl-auto=validate)
        │
        └─→ 启动完成
                │
                └─→ 监听 HTTP 请求

┌─────────────────────────────────────────────────────────────────────────┐
│                        请求处理流程                                      │
└─────────────────────────────────────────────────────────────────────────┘

用户浏览器访问 http://localhost:8080/dashboard.html
        │
        ▼
Tomcat 接收请求
        │
        ├─→ 静态资源请求？
        │       ├─ 是 → 从/static/目录返回文件
        │       └─ 否 → 继续处理
        │
        ▼
前端 JavaScript 发起 AJAX 请求
        │
        ├─→ GET /api/holdings/summary
        │
        ▼
DispatcherServlet 拦截请求
        │
        ├─→ 路由到 HoldingController.getPortfolioSummary()
        │
        ▼
Controller 调用 Service
        │
        └─→ HoldingService.getPortfolioSummary()
                │
                ├─→ 调用 Repository 获取数据
                │       └─→ holdingRepository.findAll()
                │
                ├─→ 执行计算逻辑
                │       ├─ 总价值 = Σ(currentPrice × volume)
                │       ├─ 总成本 = Σ(purchasePrice × volume)
                │       ├─ 盈亏 = totalValue - totalCost
                │       └─ 盈亏比例 = (profitLoss / totalCost) × 100%
                │
                └─→ 返回 PortfolioSummary 对象
                        │
                        ▼
                Jackson 序列化为 JSON
                        │
                        ▼
                返回 HTTP 响应 (Content-Type: application/json)
                        │
                        ▼
                前端 JavaScript 接收数据
                        │
                        └─→ Chart.js 渲染图表
```

---

这份 ASCII 艺术风格的架构图详细展示了整个 Portfolio Manager 系统的各个层面，包括业务架构、技术栈、数据流、API 接口等。无需 Mermaid 即可查看清晰的框架结构！
