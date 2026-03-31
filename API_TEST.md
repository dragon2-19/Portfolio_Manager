# 股票数据API测试说明

## 数据源优先级

系统现在使用三重数据源，按以下顺序尝试：

1. **东方财富网API** (首选) - 数据最稳定，响应速度快
2. **腾讯财经API** (备用1) - 数据格式简单，兼容性好
3. **新浪财经API** (备用2) - 作为最后的备选方案

## 修复的问题

### 1. 东方财富网API
- ✅ 添加了正确的请求头和参数
- ✅ 处理JSONP格式的响应
- ✅ 清理控制字符，避免JSON解析错误

### 2. 腾讯财经API
- ✅ 修复字符串索引越界错误
- ✅ 增加边界检查和错误处理
- ✅ 添加重试机制

### 3. 新浪财经API
- ✅ 简化请求头，避免403错误
- ✅ 添加备用解析方法
- ✅ 改进错误处理

## 测试步骤

1. 启动应用
   ```bash
   mvn spring-boot:run -Dspring-boot.run.mainClass=com.drake.PortfolioApplication
   ```

2. 测试股票查询
   ```bash
   curl http://localhost:8080/api/stocks/600519
   curl http://localhost:8080/api/stocks/000001
   curl http://localhost:8080/api/stocks/600036
   ```

3. 测试股票搜索
   ```bash
   curl "http://localhost:8080/api/stocks/search?query=贵州"
   curl "http://localhost:8080/api/stocks/search?query=600519"
   ```

4. 测试历史数据
   ```bash
   curl "http://localhost:8080/api/stocks/600519/history?range=1mo"
   curl "http://localhost:8080/api/stocks/600519/history?range=3mo"
   ```

## 测试股票列表

支持测试的热门A股代码：
- 600000 - 浦发银行
- 600036 - 招商银行
- 000001 - 平安银行
- 000002 - 万科A
- 000858 - 五粮液
- 601318 - 中国平安
- 600519 - 贵州茅台
- 601390 - 中国中铁
- 601398 - 工商银行
- 600276 - 恒瑞医药
- 000651 - 格力电器
- 600031 - 三一重工
- 600887 - 伊利股份
- 000333 - 美的集团
- 601012 - 隆基绿能
- 600030 - 中信证券
- 000725 - 京东方A
- 600690 - 海尔智家
- 601888 - 中国中免
- 601919 - 中远海控

## 常见问题

### Q: 为什么返回空数据或默认值？
A: 可能的原因：
1. API服务器暂时不可用
2. 网络连接问题
3. 股票代码格式不正确

### Q: 如何判断使用了哪个数据源？
A: 查看控制台日志，会输出使用的数据源：
- "Eastmoney API" - 东方财富网
- "Tencent API" - 腾讯财经
- "Sina API" - 新浪财经

### Q: 如何添加新的股票代码？
A: 在StockService.java的searchStocks方法中添加到stockList数组。

## 性能优化

1. 请求超时控制
2. 自动重试机制（东方财富网3次，腾讯2次）
3. 快速失败，避免长时间等待

## 未来改进方向

- [ ] 添加WebSocket实时推送
- [ ] 实现数据缓存机制
- [ ] 添加更多技术指标
- [ ] 支持港股和美股数据
