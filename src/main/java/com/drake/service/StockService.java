package com.drake.service;

import com.drake.dto.StockInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class StockService {

    // 东方财富网API（首选）
    private static final String EASTMONEY_REALTIME_URL = "http://push2.eastmoney.com/api/qt/stock/get";
    private static final String EASTMONEY_KLINE_URL = "http://push2.eastmoney.com/api/qt/stock/kline";

    // 腾讯财经API（备用）
    private static final String TENCENT_REALTIME_URL = "http://qt.gtimg.cn/q=";
    private static final String SINA_REALTIME_URL = "http://hq.sinajs.cn/list=";
    private static final String SINA_KLINE_URL = "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StockInfo getStockInfo(String ticker) {
        try {
            String sinaCode = convertToSinaCode(ticker);
            String eastmoneyCode = convertToEastmoneyCode(ticker);

            // 优先尝试东方财富网API
            StockInfo stockInfo = tryEastmoneyApi(ticker, eastmoneyCode, sinaCode);

            // 如果东方财富网API失败，尝试腾讯财经API
            if (stockInfo == null || stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) == 0) {
                stockInfo = tryTencentApi(ticker, sinaCode);
            }

            // 如果腾讯API失败，尝试新浪财经API
            if (stockInfo == null || stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) == 0) {
                stockInfo = trySinaApi(ticker, sinaCode);
            }

            // 获取K线数据
            if (stockInfo != null && stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                List<StockInfo.PriceHistoryPoint> history = getKlineDataFromEastmoney(eastmoneyCode, 30);
                if (history.isEmpty()) {
                    history = getKlineData(sinaCode, 30);
                }
                stockInfo.setPriceHistory(history);
            }

            return stockInfo != null ? stockInfo : createDefaultStockInfo(ticker);
        } catch (Exception e) {
            System.err.println("Error fetching stock info for " + ticker + ": " + e.getMessage());
            return createDefaultStockInfo(ticker);
        }
    }

    /**
     * 尝试使用东方财富网API获取股票信息
     */
    private StockInfo tryEastmoneyApi(String ticker, String eastmoneyCode, String sinaCode) {
        try {
            String url = EASTMONEY_REALTIME_URL + "?secid=" + eastmoneyCode +
                    "&fields=f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f57,f58,f60,f107,f152,f161,f169,f170" +
                    "&ut=fa5fd1943c7b386f172d6893dbfba10b&invt=2&fltt=2&cb=jsonp";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Referer", "https://quote.eastmoney.com/");
            headers.set("Accept", "*/*");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

            return parseEastmoneyStockInfo(ticker, response);
        } catch (Exception e) {
            System.err.println("Eastmoney API error for " + ticker + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * 将股票代码转换为东方财富网代码格式
     * 格式：市场代码.股票代码
     * 上海：1.600000, 深圳：0.000001
     */
    private String convertToEastmoneyCode(String ticker) {
        ticker = ticker.toUpperCase().trim();

        // 如果已经是东方财富格式，直接返回
        if (ticker.matches("[01]\\.\\d{6}")) {
            return ticker;
        }

        // 纯数字且为6位，判断为A股
        if (ticker.matches("\\d{6}")) {
            // 上海证券交易所：600xxx, 601xxx, 603xxx, 688xxx
            if (ticker.startsWith("6")) {
                return "1." + ticker;
            }
            // 深圳证券交易所：000xxx, 002xxx, 300xxx
            else {
                return "0." + ticker;
            }
        }

        // 默认返回上海市场
        return "1." + ticker;
    }

    /**
     * 解析东方财富网实时股票数据
     */
    private StockInfo parseEastmoneyStockInfo(String ticker, String response) {
        try {
            // 东方财富网返回JSONP格式，需要去除回调函数名
            String jsonStr = response;

            // 移除JSONP包装
            if (jsonStr.startsWith("jsonp")) {
                int start = jsonStr.indexOf('(');
                int end = jsonStr.lastIndexOf(')');
                if (start > 0 && end > start) {
                    jsonStr = jsonStr.substring(start + 1, end);
                }
            }

            // 清理可能的控制字符
            jsonStr = jsonStr.replaceAll("[\\x00-\\x1F\\x7F]", "");

            JsonNode root = objectMapper.readTree(jsonStr);

            // 检查是否有数据
            if (root.has("data") && !root.get("data").isNull() && root.get("data").isObject()) {
                JsonNode data = root.get("data");

                // 方式1：从diff数组获取（新版API）
                if (data.has("diff") && data.get("diff").isArray() && data.get("diff").size() > 0) {
                    JsonNode quote = data.get("diff").get(0);

                    String name = quote.has("f14") ? quote.get("f14").asText() : ticker;
                    BigDecimal currentPrice = quote.has("f3") ? parseBigDecimal(quote.get("f3").asText()) :
                                               quote.has("f2") ? parseBigDecimal(quote.get("f2").asText()) : BigDecimal.ZERO;
                    BigDecimal previousClose = quote.has("f18") ? parseBigDecimal(quote.get("f18").asText()) :
                                                quote.has("f17") ? parseBigDecimal(quote.get("f17").asText()) : BigDecimal.ZERO;
                    BigDecimal open = quote.has("f17") ? parseBigDecimal(quote.get("f17").asText()) :
                                           quote.has("f9") ? parseBigDecimal(quote.get("f9").asText()) : BigDecimal.ZERO;
                    BigDecimal high = quote.has("f15") ? parseBigDecimal(quote.get("f15").asText()) : BigDecimal.ZERO;
                    BigDecimal low = quote.has("f16") ? parseBigDecimal(quote.get("f16").asText()) : BigDecimal.ZERO;
                    Long volume = quote.has("f5") ? parseLong(quote.get("f5").asText()) : 0L;

                    StockInfo stockInfo = new StockInfo();
                    stockInfo.setTicker(ticker);
                    stockInfo.setName(name);
                    stockInfo.setCurrentPrice(currentPrice);
                    stockInfo.setOpen(open);
                    stockInfo.setHigh(high);
                    stockInfo.setLow(low);
                    stockInfo.setVolume(volume * 100);
                    stockInfo.setMarketCap(BigDecimal.ZERO);

                    if (previousClose.compareTo(BigDecimal.ZERO) != 0) {
                        BigDecimal change = currentPrice.subtract(previousClose);
                        BigDecimal changePercent = change.divide(previousClose, 4, BigDecimal.ROUND_HALF_UP)
                                .multiply(new BigDecimal(100));
                        stockInfo.setChange(change);
                        stockInfo.setChangePercent(changePercent);
                    } else {
                        stockInfo.setChange(BigDecimal.ZERO);
                        stockInfo.setChangePercent(BigDecimal.ZERO);
                    }

                    stockInfo.setLastUpdated(LocalDateTime.now());
                    return currentPrice.compareTo(BigDecimal.ZERO) > 0 ? stockInfo : null;
                }
            }

            return null;
        } catch (Exception e) {
            System.err.println("Error parsing Eastmoney stock info: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 解析Long类型
     */
    private long parseLong(String value) {
        try {
            if (value == null || value.isEmpty() || value.equals("-")) {
                return 0L;
            }
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    /**
     * 从东方财富网获取K线数据
     */
    private List<StockInfo.PriceHistoryPoint> getKlineDataFromEastmoney(String eastmoneyCode, int days) {
        try {
            // klt参数：101=日K，102=周K，103=月K
            String url = EASTMONEY_KLINE_URL + "?secid=" + eastmoneyCode +
                    "&fields1=f1,f2,f3,f4,f5,f6" +
                    "&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61" +
                    "&klt=101&fqt=0&beg=0&end=20500101&lmt=" + days +
                    "&ut=fa5fd1943c7b386f172d6893dbfba10b&cb=jsonp";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Referer", "https://quote.eastmoney.com/");
            headers.set("Accept", "*/*");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

            return parseEastmoneyKlineData(response);
        } catch (Exception e) {
            System.err.println("Error fetching Eastmoney K-line data: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * 解析东方财富网K线数据
     */
    private List<StockInfo.PriceHistoryPoint> parseEastmoneyKlineData(String response) {
        List<StockInfo.PriceHistoryPoint> history = new ArrayList<>();

        try {
            // 移除JSONP包装
            String jsonStr = response;
            if (jsonStr.startsWith("jsonp")) {
                int start = jsonStr.indexOf('(');
                int end = jsonStr.lastIndexOf(')');
                if (start > 0 && end > start) {
                    jsonStr = jsonStr.substring(start + 1, end);
                }
            }

            // 清理控制字符
            jsonStr = jsonStr.replaceAll("[\\x00-\\x1F\\x7F]", "");

            JsonNode root = objectMapper.readTree(jsonStr);
            JsonNode data = root.path("data");

            if (data.isMissingNode() || data.isNull()) {
                return history;
            }

            JsonNode klines = data.path("klines");
            if (klines.isArray()) {
                for (JsonNode kline : klines) {
                    String[] parts = kline.asText().split(",");
                    if (parts.length >= 6) {
                        String date = parts[0]; // 日期
                        BigDecimal close = parseBigDecimal(parts[2]); // 收盘价
                        if (close.compareTo(BigDecimal.ZERO) > 0) {
                            history.add(new StockInfo.PriceHistoryPoint(date, close));
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing Eastmoney K-line data: " + e.getMessage());
            e.printStackTrace();
        }

        return history;
    }

    public StockInfo getStockInfoWithHistory(String ticker, String range) {
        try {
            String sinaCode = convertToSinaCode(ticker);
            String eastmoneyCode = convertToEastmoneyCode(ticker);

            // 优先尝试东方财富网API
            StockInfo stockInfo = tryEastmoneyApi(ticker, eastmoneyCode, sinaCode);

            // 如果东方财富网API失败，尝试腾讯财经API
            if (stockInfo == null || stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) == 0) {
                stockInfo = tryTencentApi(ticker, sinaCode);
            }

            // 如果腾讯API失败，尝试新浪财经API
            if (stockInfo == null || stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) == 0) {
                stockInfo = trySinaApi(ticker, sinaCode);
            }

            // 根据range参数获取不同天数的K线数据
            int days = parseRangeToDays(range);
            if (stockInfo != null && stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                List<StockInfo.PriceHistoryPoint> history = getKlineDataFromEastmoney(eastmoneyCode, days);
                if (history.isEmpty()) {
                    history = getKlineData(sinaCode, days);
                }
                stockInfo.setPriceHistory(history);
            }

            return stockInfo != null ? stockInfo : createDefaultStockInfo(ticker);
        } catch (Exception e) {
            System.err.println("Error fetching stock history for " + ticker + ": " + e.getMessage());
            return createDefaultStockInfo(ticker);
        }
    }
    /**
     * 尝试使用腾讯财经API获取股票信息（带重试机制）
     */
    private StockInfo tryTencentApi(String ticker, String sinaCode) {
        int maxRetries = 2;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String url = TENCENT_REALTIME_URL + sinaCode;

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                headers.set("Accept", "*/*");
                headers.set("Referer", "https://gu.qq.com/");
                HttpEntity<String> entity = new HttpEntity<>(headers);

                String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

                StockInfo result = parseTencentStockInfo(ticker, response);
                if (result != null && result.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                    return result;
                }
            } catch (Exception e) {
                System.err.println("Tencent API error for " + ticker + " (attempt " + attempt + "/" + maxRetries + "): " + e.getMessage());

                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(300 * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        return null;
    }

    /**
     * 尝试使用新浪财经API获取股票信息（带重试机制）
     */
    private StockInfo trySinaApi(String ticker, String sinaCode) {
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String url = SINA_REALTIME_URL + sinaCode;

                HttpHeaders headers = createHeaders();
                HttpEntity<String> entity = new HttpEntity<>(headers);

                String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

                StockInfo result = parseSinaStockInfo(ticker, response);
                if (result != null && result.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                    return result;
                }
            } catch (Exception e) {
                System.err.println("Sina API error for " + ticker + " (attempt " + attempt + "/" + maxRetries + "): " + e.getMessage());

                // 如果是最后一次尝试，使用备用方法
                if (attempt == maxRetries) {
                    System.out.println("Trying backup method for Sina API...");
                    return trySinaBackupMethod(ticker, sinaCode);
                }

                // 等待一段时间后重试
                try {
                    Thread.sleep(500 * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        return null;
    }

    /**
     * 备用的新浪财经API方法（使用不同的请求方式）
     */
    private StockInfo trySinaBackupMethod(String ticker, String sinaCode) {
        try {
            // 使用更简单的URL和不同的参数
            String url = "http://hq.sinajs.cn/list=" + sinaCode.toLowerCase();

            // 简化请求头
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

            return parseSinaStockInfoSimple(ticker, response);
        } catch (Exception e) {
            System.err.println("Sina backup method also failed for " + ticker + ": " + e.getMessage());
            return null;
        }
    }

    /**
     * 简化的新浪股票数据解析
     */
    private StockInfo parseSinaStockInfoSimple(String ticker, String response) {
        try {
            // 新浪返回格式: var hq_str_sh600000="浦发银行,24.15,24.20,..."
            int startIndex = response.indexOf("=\"");
            int endIndex = response.indexOf("\"", startIndex);

            if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex + 2) {
                return null;
            }

            String data = response.substring(startIndex + 2, endIndex);

            if (data.isEmpty()) {
                return null;
            }

            String[] fields = data.split(",");

            if (fields.length < 8) {
                return null;
            }

            StockInfo stockInfo = new StockInfo();
            stockInfo.setTicker(ticker);
            stockInfo.setName(fields[0]);

            // 新浪数据字段：
            // 0: 股票名称
            // 1: 开盘价
            // 2: 昨收价
            // 3: 现价
            // 4: 最高价
            // 5: 最低价
            // 6: 买一价
            // 7: 卖一价
            // 8: 成交量(手)

            BigDecimal open = parseBigDecimal(fields[1]);
            BigDecimal previousClose = parseBigDecimal(fields[2]);
            BigDecimal currentPrice = parseBigDecimal(fields[3]);
            BigDecimal high = parseBigDecimal(fields[4]);
            BigDecimal low = parseBigDecimal(fields[5]);
            long volume = fields.length > 8 ? parseLong(fields[8]) * 100 : 0L;

            stockInfo.setCurrentPrice(currentPrice);
            stockInfo.setOpen(open);
            stockInfo.setHigh(high);
            stockInfo.setLow(low);
            stockInfo.setVolume(volume);
            stockInfo.setMarketCap(BigDecimal.ZERO);

            // 计算涨跌幅
            if (previousClose.compareTo(BigDecimal.ZERO) != 0) {
                BigDecimal change = currentPrice.subtract(previousClose);
                BigDecimal changePercent = change.divide(previousClose, 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(new BigDecimal(100));
                stockInfo.setChange(change);
                stockInfo.setChangePercent(changePercent);
            } else {
                stockInfo.setChange(BigDecimal.ZERO);
                stockInfo.setChangePercent(BigDecimal.ZERO);
            }

            stockInfo.setLastUpdated(LocalDateTime.now());

            return stockInfo;
        } catch (Exception e) {
            System.err.println("Error parsing Sina simple stock info: " + e.getMessage());
            return null;
        }
    }

    /**
     * 将股票代码转换为新浪财经代码格式
     */
    private String convertToSinaCode(String ticker) {
        ticker = ticker.toUpperCase().trim();
        
        // 如果已经是新浪格式，直接返回
        if (ticker.startsWith("SH") || ticker.startsWith("SZ")) {
            return ticker;
        }
        
        // 纯数字且为6位，判断为A股
        if (ticker.matches("\\d{6}")) {
            // 上海证券交易所：600xxx, 601xxx, 603xxx, 688xxx
            if (ticker.startsWith("6")) {
                return "sh" + ticker;
            }
            // 深圳证券交易所：000xxx, 002xxx, 300xxx
            else {
                return "sz" + ticker;
            }
        }
        
        // 默认使用上海市场
        return ticker;
    }

    /**
     * 解析腾讯实时股票数据
     */
    private StockInfo parseTencentStockInfo(String ticker, String response) {
        try {
            if (response == null || response.isEmpty()) {
                return null;
            }

            // 腾讯返回格式: v_sh600000="1~贵州茅台~600519~1463.88~1420.00~1468.00~..."
            int startIndex = response.indexOf("=\"");
            int endIndex = response.indexOf("\"", startIndex);

            if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex + 2) {
                System.err.println("Tencent API response format invalid");
                return null;
            }

            String data = response.substring(startIndex + 2, endIndex);

            if (data.isEmpty()) {
                return null;
            }

            String[] fields = data.split("~");

            // 根据实际响应格式解析字段
            // v_sh600519="1~贵州茅台~600519~1463.88~1420.00~1468.00~17714~8633~9027~1463.03~8~..."
            // 0: 标志
            // 1: 股票名称
            // 2: 股票代码
            // 3: 当前价格
            // 4: 昨收价
            // 5: 今开价
            // 6: 买一量(手) - 不是最高价
            // 7: 卖一量(手) - 不是最低价
            // 8: 买一量(手)
            // 9: 买一价
            // 10: 买一量(手)
            // 11: 卖一价
            // ... 其他字段

            StockInfo stockInfo = new StockInfo();
            stockInfo.setTicker(ticker);

            // 基础字段
            String name = fields.length > 1 ? fields[1] : ticker;
            stockInfo.setName(name);

            // 价格数据
            BigDecimal currentPrice = fields.length > 3 ? parseBigDecimal(fields[3]) : BigDecimal.ZERO;
            BigDecimal previousClose = fields.length > 4 ? parseBigDecimal(fields[4]) : BigDecimal.ZERO;
            BigDecimal open = fields.length > 5 ? parseBigDecimal(fields[5]) : BigDecimal.ZERO;

            // 由于腾讯API格式复杂，某些字段可能需要从其他位置获取
            // 先使用可获取的价格数据，其他字段设为0或使用其他数据源
            BigDecimal high = BigDecimal.ZERO;
            BigDecimal low = BigDecimal.ZERO;
            long volume = 0L;

            stockInfo.setCurrentPrice(currentPrice);
            stockInfo.setOpen(open);
            stockInfo.setHigh(high);
            stockInfo.setLow(low);

            // 计算涨跌幅
            if (previousClose.compareTo(BigDecimal.ZERO) != 0) {
                BigDecimal change = currentPrice.subtract(previousClose);
                BigDecimal changePercent = change.divide(previousClose, 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(new BigDecimal(100));
                stockInfo.setChange(change);
                stockInfo.setChangePercent(changePercent);
            } else {
                stockInfo.setChange(BigDecimal.ZERO);
                stockInfo.setChangePercent(BigDecimal.ZERO);
            }

            stockInfo.setVolume(volume);
            stockInfo.setMarketCap(BigDecimal.ZERO);
            stockInfo.setLastUpdated(LocalDateTime.now());

            // 只有当前价格有效才返回
            return currentPrice.compareTo(BigDecimal.ZERO) > 0 ? stockInfo : null;
        } catch (Exception e) {
            System.err.println("Error parsing Tencent stock info: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 解析新浪实时股票数据
     */
    private StockInfo parseSinaStockInfo(String ticker, String response) {
        try {
            // 新浪返回格式: var hq_str_sh600000="浦发银行,24.15,24.20,..."
            int startIndex = response.indexOf("=\"");
            int endIndex = response.indexOf("\"");
            
            if (startIndex == -1 || endIndex == -1) {
                return null;
            }
            
            String data = response.substring(startIndex + 2, endIndex);
            String[] fields = data.split(",");
            
            if (fields.length < 32) {
                return null;
            }
            
            // 新浪数据字段说明：
            // 0: 股票名称
            // 1: 开盘价
            // 2: 昨收价
            // 3: 现价
            // 4: 最高价
            // 5: 最低价
            // 6: 买一价
            // 7: 卖一价
            // 8: 成交量(手)
            // 9: 成交额(元)
            // ... 其他字段
            
            StockInfo stockInfo = new StockInfo();
            stockInfo.setTicker(ticker);
            stockInfo.setName(fields[0]);
            
            BigDecimal currentPrice = parseBigDecimal(fields[3]);
            BigDecimal previousClose = parseBigDecimal(fields[2]);
            BigDecimal open = parseBigDecimal(fields[1]);
            BigDecimal high = parseBigDecimal(fields[4]);
            BigDecimal low = parseBigDecimal(fields[5]);
            
            stockInfo.setCurrentPrice(currentPrice);
            stockInfo.setOpen(open);
            stockInfo.setHigh(high);
            stockInfo.setLow(low);
            
            // 计算涨跌幅
            if (previousClose.compareTo(BigDecimal.ZERO) != 0) {
                BigDecimal change = currentPrice.subtract(previousClose);
                BigDecimal changePercent = change.divide(previousClose, 4, BigDecimal.ROUND_HALF_UP)
                        .multiply(new BigDecimal(100));
                stockInfo.setChange(change);
                stockInfo.setChangePercent(changePercent);
            } else {
                stockInfo.setChange(BigDecimal.ZERO);
                stockInfo.setChangePercent(BigDecimal.ZERO);
            }
            
            // 成交量（转换为股，1手=100股）
            long volume = Long.parseLong(fields[8]) * 100;
            stockInfo.setVolume(volume);
            
            // 市值（新浪没有直接提供，设为0）
            stockInfo.setMarketCap(BigDecimal.ZERO);
            
            stockInfo.setLastUpdated(LocalDateTime.now());
            
            return stockInfo;
        } catch (Exception e) {
            System.err.println("Error parsing Sina stock info: " + e.getMessage());
            return null;
        }
    }

    /**
     * 获取K线数据
     */
    private List<StockInfo.PriceHistoryPoint> getKlineData(String sinaCode, int days) {
        try {
            // scale参数: 240=日K, 60=1小时K, 30=30分钟K, 15=15分钟K, 5=5分钟K
            String url = SINA_KLINE_URL + "?symbol=" + sinaCode + "&scale=240&ma=no&datalen=" + days;

            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

            return parseKlineData(response);
        } catch (Exception e) {
            System.err.println("Error fetching K-line data: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * 解析K线数据
     */
    private List<StockInfo.PriceHistoryPoint> parseKlineData(String response) {
        List<StockInfo.PriceHistoryPoint> history = new ArrayList<>();
        
        try {
            // 新威返回JSON数组
            JsonNode root = objectMapper.readTree(response);
            
            if (root.isArray()) {
                for (JsonNode node : root) {
                    // 每个节点包含: day, open, high, low, close, volume
                    String date = node.get("day").asText();
                    BigDecimal close = new BigDecimal(node.get("close").asText());
                    
                    history.add(new StockInfo.PriceHistoryPoint(date, close));
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing K-line data: " + e.getMessage());
        }
        
        return history;
    }

    /**
     * 解析BigDecimal
     */
    private BigDecimal parseBigDecimal(String value) {
        try {
            if (value == null || value.isEmpty() || value.equals("-")) {
                return BigDecimal.ZERO;
            }
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    /**
     * 将range转换为天数
     */
    private int parseRangeToDays(String range) {
        if (range == null || range.isEmpty()) {
            return 30;
        }
        
        switch (range.toLowerCase()) {
            case "1d":
                return 1;
            case "5d":
                return 5;
            case "1mo":
                return 30;
            case "3mo":
                return 90;
            case "6mo":
                return 180;
            case "1y":
                return 365;
            case "2y":
                return 730;
            case "5y":
                return 1825;
            default:
                return 30;
        }
    }
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set("Accept", "*/*");
        headers.set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8");
        headers.set("Accept-Encoding", "gzip, deflate");
        headers.set("Referer", "https://finance.sina.com.cn/");
        headers.set("Connection", "keep-alive");
        headers.set("Cache-Control", "no-cache");
        headers.set("Pragma", "no-cache");
        return headers;
    }

    public List<StockInfo> searchStocks(String query) {
        // 国内财经平台没有公开的搜索API
        // 返回预定义的A股股票，支持按代码或名称搜索
        List<StockInfo> results = new ArrayList<>();

        // 预定义A股股票列表（代码, 名称）
        String[][] stockList = {
            {"600000", "浦发银行"}, {"600036", "招商银行"}, {"000001", "平安银行"},
            {"000002", "万科A"}, {"000858", "五粮液"}, {"601318", "中国平安"},
            {"600519", "贵州茅台"}, {"601390", "中国中铁"}, {"601398", "工商银行"},
            {"600276", "恒瑞医药"}, {"000651", "格力电器"}, {"600031", "三一重工"},
            {"600887", "伊利股份"}, {"000333", "美的集团"}, {"601012", "隆基绿能"},
            {"600030", "中信证券"}, {"000725", "京东方A"}, {"600690", "海尔智家"},
            {"601888", "中国中免"}, {"601919", "中远海控"}
        };

        for (String[] stock : stockList) {
            String ticker = stock[0];
            String name = stock[1];

            // 支持按代码或名称模糊搜索
            if (ticker.toLowerCase().contains(query.toLowerCase()) ||
                name.toLowerCase().contains(query.toLowerCase())) {
                StockInfo stockInfo = getStockInfo(ticker);
                if (stockInfo != null && stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                    results.add(stockInfo);
                }
            }
        }

        return results;
    }

    private StockInfo createDefaultStockInfo(String ticker) {
        StockInfo stockInfo = new StockInfo();
        stockInfo.setTicker(ticker);
        stockInfo.setName(ticker);
        stockInfo.setCurrentPrice(BigDecimal.ZERO);
        stockInfo.setChange(BigDecimal.ZERO);
        stockInfo.setChangePercent(BigDecimal.ZERO);
        stockInfo.setOpen(BigDecimal.ZERO);
        stockInfo.setHigh(BigDecimal.ZERO);
        stockInfo.setLow(BigDecimal.ZERO);
        stockInfo.setVolume(0L);
        stockInfo.setMarketCap(BigDecimal.ZERO);
        stockInfo.setLastUpdated(LocalDateTime.now());
        stockInfo.setPriceHistory(new ArrayList<>());
        return stockInfo;
    }
}
