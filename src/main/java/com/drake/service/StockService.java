package com.drake.service;

import com.drake.dto.StockInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Service
public class StockService {

    // 新浪财经API（主要数据源）
    private static final String SINA_REALTIME_URL = "http://hq.sinajs.cn/list=";
    private static final String SINA_KLINE_URL = "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StockInfo getStockInfo(String ticker) {
        try {
            String sinaCode = convertToSinaCode(ticker);

            // 使用新浪财经API获取实时数据
            StockInfo stockInfo = trySinaApi(ticker, sinaCode);

            // 获取K线数据（默认30天）
            if (stockInfo != null && stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                List<StockInfo.PriceHistoryPoint> history = getKlineData(sinaCode, 30);
                stockInfo.setPriceHistory(history);
            }

            return stockInfo != null ? stockInfo : createDefaultStockInfo(ticker);
        } catch (Exception e) {
            System.err.println("Error fetching stock info for " + ticker + ": " + e.getMessage());
            return createDefaultStockInfo(ticker);
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
     * 获取股票今日开盘价
     * @param ticker 股票代码
     * @return 今日开盘价
     */
    public BigDecimal getTodayOpenPrice(String ticker) {
        try {
            String sinaCode = convertToSinaCode(ticker);
            StockInfo stockInfo = trySinaApi(ticker, sinaCode);
            if (stockInfo != null) {
                System.out.println("DEBUG: Got stock info for " + ticker + ", open price: " + stockInfo.getOpen());
                return stockInfo.getOpen();
            }
        } catch (Exception e) {
            System.err.println("Error fetching open price for " + ticker + ": " + e.getMessage());
        }
        return BigDecimal.ZERO;
    }

    public StockInfo getStockInfoWithHistory(String ticker, String range) {
        try {
            String sinaCode = convertToSinaCode(ticker);

            // 使用新浪财经API获取实时数据
            StockInfo stockInfo = trySinaApi(ticker, sinaCode);

            // 根据range参数获取不同天数的K线数据
            int days = parseRangeToDays(range);
            if (stockInfo != null && stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                List<StockInfo.PriceHistoryPoint> history = getKlineData(sinaCode, days);
                stockInfo.setPriceHistory(history);
            }

            return stockInfo != null ? stockInfo : createDefaultStockInfo(ticker);
        } catch (Exception e) {
            System.err.println("Error fetching stock history for " + ticker + ": " + e.getMessage());
            return createDefaultStockInfo(ticker);
        }
    }
    /**
     * 尝试使用新浪财经API获取股票信息（带重试机制）
     */
    private StockInfo trySinaApi(String ticker, String sinaCode) {
        System.out.println("DEBUG: trySinaApi called for " + ticker + ", sinaCode: " + sinaCode);
        
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String url = SINA_REALTIME_URL + sinaCode;
                System.out.println("DEBUG: Attempt " + attempt + ", URL: " + url);

                HttpHeaders headers = createHeaders();
                HttpEntity<String> entity = new HttpEntity<>(headers);

                String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
                System.out.println("DEBUG: Response length: " + (response != null ? response.length() : "null"));

                StockInfo result = parseSinaStockInfo(ticker, response);
                if (result != null && result.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                    System.out.println("DEBUG: Successfully parsed stock info for " + ticker);
                    return result;
                } else {
                    System.out.println("DEBUG: Stock info is null or price is zero for " + ticker);
                }
            } catch (Exception e) {
                System.err.println("Sina API error for " + ticker + " (attempt " + attempt + "/" + maxRetries + "): " + e.getMessage());
                e.printStackTrace();

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
        System.out.println("DEBUG: trySinaBackupMethod called for " + ticker + ", sinaCode: " + sinaCode);
        
        try {
            // 使用更简单的URL和不同的参数
            String url = "http://hq.sinajs.cn/list=" + sinaCode.toLowerCase();
            System.out.println("DEBUG: Backup URL: " + url);

            // 简化请求头
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            System.out.println("DEBUG: Backup response length: " + (response != null ? response.length() : "null"));

            return parseSinaStockInfoSimple(ticker, response);
        } catch (Exception e) {
            System.err.println("Sina backup method also failed for " + ticker + ": " + e.getMessage());
            e.printStackTrace();
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
                BigDecimal changePercent = change.divide(previousClose, 4, RoundingMode.HALF_UP)
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
     * 解析新浪实时股票数据
     */
    private StockInfo parseSinaStockInfo(String ticker, String response) {
        try {
            System.out.println("DEBUG: Parsing Sina response for " + ticker + ": " + response);
            
            // 新浪返回格式: var hq_str_sh600000="浦发银行,24.15,24.20,..."
            int startIndex = response.indexOf("=\"");
            int endIndex = response.indexOf("\"", startIndex + 2);
            
            if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex + 2) {
                System.out.println("DEBUG: Failed to find data boundaries for " + ticker);
                return null;
            }
            
            String data = response.substring(startIndex + 2, endIndex);
            String[] fields = data.split(",");
            
            System.out.println("DEBUG: Fields length for " + ticker + ": " + fields.length);
            
            if (fields.length < 32) {
                System.out.println("DEBUG: Insufficient fields for " + ticker + ": " + fields.length);
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
                BigDecimal changePercent = change.divide(previousClose, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100));
                stockInfo.setChange(change);
                stockInfo.setChangePercent(changePercent);
            } else {
                stockInfo.setChange(BigDecimal.ZERO);
                stockInfo.setChangePercent(BigDecimal.ZERO);
            }
            
            // 成交量（转换为股，1手=100股）
            long volume = parseLong(fields[8]) * 100;
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
     * @param sinaCode 新浪股票代码（如：sh600519）
     * @param days 需要获取的天数
     * @return K线数据列表
     */
    private List<StockInfo.PriceHistoryPoint> getKlineData(String sinaCode, int days) {
        try {
            // 最多获取1023个数据节点（新浪限制）
            int dataLen = Math.min(days, 1023);

            // scale参数：
            // 5 = 5分钟K线
            // 30 = 30分钟K线
            // 60 = 60分钟K线
            // 240 = 日K线
            String url = SINA_KLINE_URL + "?symbol=" + sinaCode +
                    "&scale=240" +  // 使用日K线
                    "&ma=no" +         // 不包含均线
                    "&datalen=" + dataLen;

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Referer", "https://finance.sina.com.cn/");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

            return parseSinaKlineData(response);
        } catch (Exception e) {
            System.err.println("Error fetching K-line data: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    /**
     * 解析新浪K线数据
     * 新浪返回格式：[{"day":"2024-03-20","open":"1468.00","high":"1475.00","low":"1460.00","close":"1463.00","volume":"1771400"},...]
     * @param response 新浪API返回的JSON字符串
     * @return K线数据列表
     */
    private List<StockInfo.PriceHistoryPoint> parseSinaKlineData(String response) {
        List<StockInfo.PriceHistoryPoint> history = new ArrayList<>();

        try {
            if (response == null || response.isEmpty()) {
                return history;
            }

            // 新浪返回JSON数组
            JsonNode root = objectMapper.readTree(response);

            if (root.isArray()) {
                for (JsonNode node : root) {
                    try {
                        // 每个节点包含: day, open, high, low, close, volume
                        if (node.has("day") && node.has("close")) {
                            String date = node.get("day").asText();
                            String closeStr = node.get("close").asText();

                            BigDecimal close = parseBigDecimal(closeStr);

                            // 只添加有效的价格数据
                            if (close.compareTo(BigDecimal.ZERO) > 0) {
                                history.add(new StockInfo.PriceHistoryPoint(date, close));
                            }
                        }
                    } catch (Exception e) {
                        // 跳过解析失败的单个数据点
                        continue;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing Sina K-line data: " + e.getMessage());
            e.printStackTrace();
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
        headers.set("Referer", "https://finance.sina.com.cn/");
        headers.set("Connection", "keep-alive");
        headers.set("Cache-Control", "no-cache");
        headers.set("Pragma", "no-cache");
        return headers;
    }

    public List<StockInfo> searchStocks(String query) {
        System.out.println("DEBUG: searchStocks called with query: " + query);
        
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
                System.out.println("DEBUG: Found matching stock: " + ticker + " - " + name);
                StockInfo stockInfo = getStockInfo(ticker);
                System.out.println("DEBUG: StockInfo for " + ticker + ": " + 
                    (stockInfo != null ? "currentPrice=" + stockInfo.getCurrentPrice() : "null"));
                if (stockInfo != null && stockInfo.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                    System.out.println("DEBUG: Adding " + ticker + " to results");
                    results.add(stockInfo);
                }
            }
        }

        System.out.println("DEBUG: Total results: " + results.size());
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
