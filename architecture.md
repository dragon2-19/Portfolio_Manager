# Portfolio Manager - 项目架构详解

> 本文档从简洁到复杂层层深入地说明 Portfolio Manager 项目的整体架构。

---

## 🎯 第一层：核心概念（一句话概括）

这是一个基于 **Spring Boot** 的**投资组合管理系统**，通过 **REST API** 管理股票持仓和交易记录，并从**新浪财经**获取实时行情数据。

---

## 🏗️ 第二层：核心架构分层（三层架构）

```
┌─────────────────────────────────────────────┐
│        前端层 (HTML/JS/CSS)                 │
│   dashboard / holdings / transactions       │
└─────────────────┬───────────────────────────┘
                  │ HTTP/REST API
                  ↓
┌─────────────────────────────────────────────┐
│     Spring Boot 应用层                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Controller│→ │ Service  │→ │Repository│  │
│  └──────────┘  └────┬─────┘  └────┬─────┘  │
│                     │              │         │
│            ┌────────┴─────┐        │         │
│            │StockService  │        │         │
│            └──────┬───────┘        │         │
└───────────────────┼────────────────┼─────────┘
                    │                │ JDBC/Hibernate
                    │ HTTP Client    ↓
                    │      ┌─────────────────────┐
                    │      │   MySQL 数据库       │
                    │      │ holding 表           │
                    │      │ transaction 表       │
                    │      └─────────────────────┘
                    ↓
          ┌─────────────────────┐
          │   新浪财经 API       │
          │   实时行情数据       │
          └─────────────────────┘
```

---

## 🔧 第三层：技术栈组成

### 后端技术栈
- **框架**: Spring Boot 3.4.5（内嵌 Tomcat）
- **语言**: Java 25
- **ORM**: Spring Data JPA + Hibernate
- **数据库**: MySQL 8.0+
- **HTTP 客户端**: Spring RestTemplate
- **构建工具**: Maven
- **代码简化**: Lombok
- **JSON 处理**: Jackson

### 前端技术栈
- **原生技术**: HTML5 + CSS3 + JavaScript
- **图表库**: Chart.js（可视化图表）
- **通信方式**: Fetch API

### 外部集成
- **A 股行情**: 新浪财经实时 API
- **K 线数据**: 新浪财经历史数据 API

---

## 📦 第四层：项目文件结构

```
Portfolio_Manager/
├── src/main/
│   ├── java/com/drake/
│   │   ├── controller/        # REST API 控制器（3 个）
│   │   │   ├── HoldingController      → /api/holdings/*
│   │   │   ├── TransactionController  → /api/transactions/*
│   │   │   └── StockController        → /api/stocks/*
│   │   ├── service/           # 业务逻辑层（3 个）
│   │   │   ├── HoldingService
│   │   │   ├── TransactionService
│   │   │   └── StockService
│   │   ├── repository/        # 数据访问层（2 个）
│   │   │   ├── HoldingRepository
│   │   │   └── TransactionRepository
│   │   ├── model/             # 实体模型
│   │   │   ├── Holding        → 持仓实体
│   │   │   └── Transaction    → 交易实体
│   │   ├── dto/               # 数据传输对象
│   │   │   ├── PortfolioSummary  → 组合汇总
│   │   │   └── StockInfo         → 股票信息
│   │   └── PortfolioApplication.java  # 启动类
│   └── resources/
│       ├── static/            # 前端静态资源
│       │   ├── dashboard.html/js  → 仪表盘
│       │   ├── holdings.html/js     → 持仓管理
│       │   ├── transactions.html/js → 交易管理
│       │   ├── search.html/js       → 股票搜索
│       │   ├── style.css
│       │   └── common.js
│       └── application.properties   # 配置文件
└── pom.xml                     # Maven 依赖配置
```

---

## 🔄 第五层：核心业务流程

### 1️⃣ 持仓管理流程

```
用户请求 → HoldingController → HoldingService → HoldingRepository → MySQL
                                    ↓
                            业务处理:
                            - CRUD 操作
                            - 盈亏计算
                            - 资产分类
                            - 组合汇总
```

### 2️⃣ 交易执行流程

```
买入/卖出请求 → TransactionController → TransactionService
                                              ↓
                                       验证逻辑:
                                       - 查找持仓
                                       - 库存检查
                                       - 更新持仓数量
                                               ↓
                                    保存交易记录 → TransactionRepository → MySQL
```

### 3️⃣ 行情获取流程

```
行情请求 → StockController → StockService → 新浪财经 API
                                   ↓
                            数据处理:
                            - 股票代码转换
                            - JSON 解析
                            - K 线数据获取
                                   ↓
                              返回 StockInfo DTO
```

---

## 💾 第六层：数据模型设计

### Holding（持仓）实体

```java
Holding {
    id: Long                      // 主键
    ticker: String                // 股票代码
    volume: Integer               // 持仓数量
    assetType: String             // 资产类型 (STOCK/BOND/CASH)
    purchasePrice: BigDecimal     // 买入价
    purchaseDate: LocalDate       // 买入日期
    currentPrice: BigDecimal      // 当前价
    lastUpdated: LocalDateTime    // 最后更新时间
    
    // 核心计算方法
    getTotalValue()              // 总价值 = 现价 × 数量
    getTotalCost()               // 总成本 = 买入价 × 数量
    getProfitLoss()              // 盈亏金额
    getProfitLossPercentage()    // 盈亏比例
}
```

### Transaction（交易）实体

```java
Transaction {
    id: Long                      // 主键
    holding: Holding              // 关联持仓（多对一）
    transactionType: String       // BUY/SELL
    volume: Integer               // 交易数量
    price: BigDecimal             // 成交价
    transactionDate: LocalDateTime // 交易时间
    totalAmount: BigDecimal       // 总金额
}
```

### 数据库表结构

```sql
-- 持仓表
holding (
    id, ticker, volume, asset_type, 
    purchase_price, purchase_date, 
    current_price, last_updated
)

-- 交易表
transaction (
    id, holding_id, transaction_type, 
    volume, price, transaction_date, total_amount
)
```

---

## 🌐 第七层：API 接口设计

### 持仓管理 API (`/api/holdings`)

- `GET /` - 获取所有持仓
- `GET /summary` - 获取组合汇总
- `GET /{id}` - 获取单个持仓
- `GET /type/{type}` - 按资产类型筛选
- `POST /` - 创建持仓
- `PUT /{id}` - 更新持仓
- `PATCH /{id}/price` - 更新现价
- `DELETE /{id}` - 删除持仓

### 交易管理 API (`/api/transactions`)

- `GET /` - 获取所有交易
- `GET /{id}` - 获取单条交易
- `GET /holding/{id}` - 按持仓查询
- `POST /` - 创建交易
- `POST /buy` - 买入操作
- `POST /sell` - 卖出操作
- `DELETE /{id}` - 删除交易
- `GET /recent` - 近期交易

### 股票行情 API (`/api/stocks`)

- `GET /{ticker}` - 获取股票信息
- `GET /{ticker}/history` - 获取历史 K 线
- `GET /search` - 搜索股票
- `POST /update-holding-price` - 更新持仓价格

---

## ⚙️ 第八层：配置与部署

### application.properties 配置

```properties
# 服务器端口
server.port=8080

# 数据库连接
spring.datasource.url=jdbc:mysql://localhost:3306/portfolio_db
spring.datasource.username=forina
spring.datasource.password=zq357896214
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA 配置
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

### 运行环境要求

- **JDK**: Java 25+
- **数据库**: MySQL 8.0+
- **构建工具**: Maven
- **启动命令**: `mvn spring-boot:run`
- **访问地址**: `http://localhost:8080`

---

## 🎨 第九层：前端页面架构

```
dashboard.html     → 仪表盘（组合概览 + 饼图）
   ↓
   调用 /api/holdings/summary
   
holdings.html      → 持仓管理页面（列表 + 表单）
   ↓
   调用 /api/holdings/*
   
transactions.html  → 交易管理页面（买入/卖出）
   ↓
   调用 /api/transactions/*
   
search.html        → 股票搜索页面
   ↓
   调用 /api/stocks/search
```

**前端技术特点**:
- 原生 JavaScript
- Chart.js 可视化图表
- Fetch API 异步请求
- 响应式 CSS 样式

---

## 🔍 第十层：核心业务逻辑详解

### 盈亏计算逻辑

```java
// 1. 总价值 = 当前价 × 持仓数量
getTotalValue() = currentPrice × volume

// 2. 总成本 = 买入价 × 持仓数量
getTotalCost() = purchasePrice × volume

// 3. 盈亏金额 = 总价值 - 总成本
getProfitLoss() = getTotalValue() - getTotalCost()

// 4. 盈亏比例 = (盈亏金额 / 总成本) × 100%
getProfitLossPercentage() = (profitLoss / totalCost) × 100
```

### 买入交易逻辑

```
1. 接收买入请求（ticker, volume, price）
2. 查找是否存在该持仓
3. 创建交易记录（type = BUY）
4. 更新持仓数量：volume += 买入数量
5. 更新持仓成本（加权平均）
6. 保存交易记录和持仓
7. 返回成功响应
```

### 卖出交易逻辑

```
1. 接收卖出请求（ticker, volume, price）
2. 查找持仓并验证库存充足
3. 创建交易记录（type = SELL）
4. 更新持仓数量：volume -= 卖出数量
5. 如果 volume = 0，清空持仓
6. 保存交易记录和持仓
7. 返回成功响应
```

---

## 🏆 架构优势总结

✅ **分层清晰**: Controller → Service → Repository 职责明确  
✅ **RESTful 设计**: 符合 REST 规范的 API 接口  
✅ **前后端分离**: 静态资源与后端 API 独立部署  
✅ **ORM 抽象**: JPA/Hibernate 简化数据库操作  
✅ **外部集成**: RestTemplate 封装第三方 API 调用  
✅ **轻量级**: 无复杂框架，易于理解和维护  

---

## 📋 完整数据流向图

```
用户操作
   ↓
[前端页面] HTML/JS
   ↓ (HTTP REST API)
[Controller 层] 路由分发
   ↓
[Service 层] 业务逻辑处理
   │
   ├─→ [Repository 层] → MySQL 数据库      ← 数据持久化
   │       (HoldingRepository/               (holding/transaction 表)
   │        TransactionRepository)
   │
   └─→ [StockService] → 新浪财经 API       ← 外部行情数据
           (直接 HTTP 调用)                    (hq.sinajs.cn)
   ↓
[DTO 对象] 数据封装 (PortfolioSummary/StockInfo)
   ↓
[Controller] JSON 响应
   ↓
[前端页面] 渲染展示
```

**说明**:
- **Repository 层**: 仅负责 MySQL 数据库的 CRUD 操作
- **StockService**: 直接调用新浪财经 API

---

## 📝 相关文档

- **ASCII 架构图**: 详见 [`architecture_ascii.md`](architecture_ascii.md) - 包含完整的 ASCII 艺术风格架构图
- **项目说明**: 详见 [`project.md`](project.md) - 项目功能介绍
- **问题描述**: 详见 [`problem.md`](problem.md) - 需求分析

---