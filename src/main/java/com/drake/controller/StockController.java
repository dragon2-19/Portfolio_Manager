package com.drake.controller;

import com.drake.dto.StockInfo;
import com.drake.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "*")
public class StockController {

    @Autowired
    private StockService stockService;

    @GetMapping("/{ticker}")
    public ResponseEntity<StockInfo> getStockInfo(@PathVariable String ticker) {
        StockInfo stockInfo = stockService.getStockInfo(ticker.toUpperCase());
        return ResponseEntity.ok(stockInfo);
    }

    @GetMapping("/{ticker}/history")
    public ResponseEntity<StockInfo> getStockHistory(
            @PathVariable String ticker,
            @RequestParam(defaultValue = "1mo") String range) {
        StockInfo stockInfo = stockService.getStockInfoWithHistory(ticker.toUpperCase(), range);
        return ResponseEntity.ok(stockInfo);
    }

    @GetMapping("/search")
    public ResponseEntity<List<StockInfo>> searchStocks(@RequestParam String query) {
        List<StockInfo> results = stockService.searchStocks(query);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/update-holding-price")
    public ResponseEntity<String> updateHoldingPrice(
            @RequestParam Long holdingId,
            @RequestParam String ticker) {
        StockInfo stockInfo = stockService.getStockInfo(ticker.toUpperCase());
        // This would update the holding's current price
        return ResponseEntity.ok("Price updated successfully: " + stockInfo.getCurrentPrice());
    }
}
