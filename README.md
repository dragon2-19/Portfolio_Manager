# 投资组合管理系统 (Portfolio Manager)

一个基于 Spring Boot + MySQL + 前后端分离的投资组合管理系统。

## 技术栈

### 后端
- **Java 25**
- **Spring Boot 3.4.5**
- **Spring Data JPA**
- **MySQL**

### 前端
- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**

## 项目结构

```
finalproject1/
├── src/
│   ├── main/
│   │   ├── java/com/drake/
│   │   │   ├── PortfolioApplication.java      # Spring Boot 主类
│   │   │   ├── controller/
│   │   │   │   └── HoldingController.java    # REST API 控制器
│   │   │   ├── service/
│   │   │   │   └── HoldingService.java       # 业务逻辑层
│   │   │   ├── repository/
│   │   │   │   └── HoldingRepository.java     # 数据访问层
│   │   │   └── model/
│   │   │       └── Holding.java               # 实体类
│   │   └── resources/
│   │       ├── application.properties        # 配置文件
│   │       └── static/
│   │           ├── index.html                # 前端页面
│   │           ├── style.css                 # 样式文件
│   │           └── script.js                 # 脚本文件
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
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动。

### 4. 访问前端

在浏览器中打开：

```
http://localhost:8080/index.html
```

## REST API 文档

### 获取所有资产

```
GET /api/holdings
```

响应示例：

```json
[
  {
    "id": 1,
    "ticker": "AAPL",
    "volume": 100,
    "assetType": "STOCK"
  }
]
```

### 获取单个资产

```
GET /api/holdings/{id}
```

### 创建资产

```
POST /api/holdings
Content-Type: application/json

{
  "ticker": "AAPL",
  "volume": 100,
  "assetType": "STOCK"
}
```

### 更新资产

```
PUT /api/holdings/{id}
Content-Type: application/json

{
  "ticker": "AAPL",
  "volume": 150,
  "assetType": "STOCK"
}
```

### 删除资产

```
DELETE /api/holdings/{id}
```

## 数据模型

### Holding（资产）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键，自增 |
| ticker | String | 股票代码/标识符 |
| volume | Integer | 持有数量 |
| assetType | String | 资产类型（STOCK/BOND/CASH） |

## 功能特性

✅ 资产列表展示
✅ 添加新资产
✅ 编辑现有资产
✅ 删除资产
✅ 按资产类型统计
✅ 响应式设计

## 后续开发计划

- [ ] 集成 Yahoo Finance API 获取实时价格
- [ ] 添加价格走势图表
- [ ] 实现收益率计算
- [ ] 添加历史交易记录
- [ ] 支持数据导出
- [ ] 添加投资建议功能
