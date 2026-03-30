package com.drake.service;

import com.drake.dto.StockInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class StockService {

    private static final String YAHOO_FINANCE_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public StockInfo getStockInfo(String ticker) {
        try {
            String url = YAHOO_FINANCE_BASE_URL + ticker + "?interval=1d&range=1mo";
            String response = restTemplate.getForObject(url, String.class);

            return parseStockInfo(ticker, response);
        } catch (Exception e) {
            System.err.println("Error fetching stock info for " + ticker + ": " + e.getMessage());
            return createDefaultStockInfo(ticker);
        }
    }

    public StockInfo getStockInfoWithHistory(String ticker, String range) {
        try {
            String url = YAHOO_FINANCE_BASE_URL + ticker + "?interval=1d&range=" + range;
            String response = restTemplate.getForObject(url, String.class);

            return parseStockInfoWithHistory(ticker, response);
        } catch (Exception e) {
            System.err.println("Error fetching stock history for " + ticker + ": " + e.getMessage());
            return createDefaultStockInfo(ticker);
        }
    }

    public List<StockInfo> searchStocks(String query) {
        // Yahoo Finance doesn't have a public search API
        // Return a list of common stocks for demonstration
        List<StockInfo> results = new ArrayList<>();

        String[] commonTickers = {"AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX"};

        for (String ticker : commonTickers) {
            if (ticker.toLowerCase().contains(query.toLowerCase())) {
                results.add(getStockInfo(ticker));
            }
        }

        return results;
    }

    private StockInfo parseStockInfo(String ticker, String response) throws Exception {
        JsonNode root = objectMapper.readTree(response);
        JsonNode result = root.get("chart").get("result");
        if (result == null || result.isEmpty()) {
            return createDefaultStockInfo(ticker);
        }

        JsonNode meta = result.get(0).get("meta");
        JsonNode indicators = result.get(0).get("indicators");
        JsonNode quote = indicators.get("quote").get(0);
        JsonNode close = quote.get("close");
        JsonNode timestamps = result.get(0).get("timestamp");

        BigDecimal currentPrice = BigDecimal.valueOf(meta.get("regularMarketPrice").asDouble());
        BigDecimal previousClose = BigDecimal.valueOf(meta.get("previousClose").asDouble());
        BigDecimal change = currentPrice.subtract(previousClose);
        BigDecimal changePercent = change.divide(previousClose, 4, BigDecimal.ROUND_HALF_UP)
                                         .multiply(new BigDecimal(100));

        StockInfo stockInfo = new StockInfo();
        stockInfo.setTicker(ticker);
        stockInfo.setName(meta.get("longName").asText());
        stockInfo.setCurrentPrice(currentPrice);
        stockInfo.setChange(change);
        stockInfo.setChangePercent(changePercent);
        stockInfo.setOpen(BigDecimal.valueOf(meta.get("regularMarketOpen").asDouble()));
        stockInfo.setHigh(BigDecimal.valueOf(meta.get("regularMarketDayHigh").asDouble()));
        stockInfo.setLow(BigDecimal.valueOf(meta.get("regularMarketDayLow").asDouble()));
        stockInfo.setVolume(meta.get("regularMarketVolume").asLong());
        stockInfo.setMarketCap(BigDecimal.valueOf(meta.get("marketCap").asDouble()));
        stockInfo.setLastUpdated(LocalDateTime.now());

        // Parse price history
        List<StockInfo.PriceHistoryPoint> priceHistory = new ArrayList<>();
        if (timestamps != null && close != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            for (int i = 0; i < timestamps.size() && i < close.size(); i++) {
                if (close.get(i).get(0) != null) {
                    String date = java.time.Instant.ofEpochSecond(timestamps.get(i).asLong())
                            .atZone(java.time.ZoneId.systemDefault())
                            .format(formatter);
                    BigDecimal price = BigDecimal.valueOf(close.get(i).get(0).asDouble());
                    priceHistory.add(new StockInfo.PriceHistoryPoint(date, price));
                }
            }
        }
        stockInfo.setPriceHistory(priceHistory);

        return stockInfo;
    }

    private StockInfo parseStockInfoWithHistory(String ticker, String response) throws Exception {
        return parseStockInfo(ticker, response);
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
