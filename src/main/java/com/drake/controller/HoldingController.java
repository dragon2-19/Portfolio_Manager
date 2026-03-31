package com.drake.controller;

import com.drake.dto.PortfolioSummary;
import com.drake.model.Holding;
import com.drake.service.HoldingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/holdings")
@CrossOrigin(origins = "*")
public class HoldingController {

    @Autowired
    private HoldingService holdingService;

    @GetMapping
    public ResponseEntity<List<Holding>> getAllHoldings() {
        List<Holding> holdings = holdingService.getAllHoldings();
        return ResponseEntity.ok(holdings);
    }

    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummary> getPortfolioSummary() {
        PortfolioSummary summary = holdingService.getPortfolioSummary();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Holding> getHoldingById(@PathVariable Long id) {
        Optional<Holding> holding = holdingService.getHoldingById(id);
        return holding.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{assetType}")
    public ResponseEntity<List<Holding>> getHoldingsByType(@PathVariable String assetType) {
        List<Holding> holdings = holdingService.getHoldingsByAssetType(assetType.toUpperCase());
        return ResponseEntity.ok(holdings);
    }

    /**
     * 获取现金余额
     */
    @GetMapping("/cash/balance")
    public ResponseEntity<BigDecimal> getCashBalance() {
        BigDecimal balance = holdingService.getCashBalance();
        return ResponseEntity.ok(balance);
    }

    /**
     * 充值现金
     */
    @PostMapping("/cash/deposit")
    public ResponseEntity<?> depositCash(@RequestParam BigDecimal amount) {
        try {
            Holding cash = holdingService.depositCash(amount);
            return ResponseEntity.ok(cash);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 提取现金
     */
    @PostMapping("/cash/withdraw")
    public ResponseEntity<?> withdrawCash(@RequestParam BigDecimal amount) {
        try {
            Holding cash = holdingService.withdrawCash(amount);
            return ResponseEntity.ok(cash);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 买入股票或债券
     */
    @PostMapping("/buy")
    public ResponseEntity<?> buyStock(
            @RequestParam String ticker,
            @RequestParam Integer volume,
            @RequestParam(required = false) String purchaseDate) {
        try {
            Holding holding = holdingService.buyStock(ticker, volume, purchaseDate);
            return ResponseEntity.status(HttpStatus.CREATED).body(holding);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 卖出股票或债券
     */
    @PostMapping("/sell")
    public ResponseEntity<?> sellStock(
            @RequestParam String ticker,
            @RequestParam Integer volume,
            @RequestParam(required = false) String sellDate) {
        try {
            Holding holding = holdingService.sellStock(ticker, volume, sellDate);
            return ResponseEntity.ok(holding);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 更新所有股票/债券持仓价格为今日开盘价
     */
    @PostMapping("/update-all-prices")
    public ResponseEntity<String> updateAllStockPricesToTodayOpen() {
        try {
            holdingService.updateAllStockPricesToTodayOpen();
            return ResponseEntity.ok("All prices updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update prices: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createHolding(@RequestBody Holding holding) {
        try {
            Holding createdHolding = holdingService.createHolding(holding);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdHolding);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Holding> updateHolding(@PathVariable Long id, @RequestBody Holding holding) {
        Holding updatedHolding = holdingService.updateHolding(id, holding);
        if (updatedHolding != null) {
            return ResponseEntity.ok(updatedHolding);
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/price")
    public ResponseEntity<Holding> updateCurrentPrice(
            @PathVariable Long id,
            @RequestParam BigDecimal currentPrice) {
        Holding updatedHolding = holdingService.updateCurrentPrice(id, currentPrice);
        if (updatedHolding != null) {
            return ResponseEntity.ok(updatedHolding);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHolding(@PathVariable Long id) {
        boolean deleted = holdingService.deleteHolding(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
