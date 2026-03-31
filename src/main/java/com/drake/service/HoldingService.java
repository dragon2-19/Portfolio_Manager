package com.drake.service;

import com.drake.dto.PortfolioSummary;
import com.drake.dto.StockInfo;
import com.drake.model.Holding;
import com.drake.model.Transaction;
import com.drake.repository.HoldingRepository;
import com.drake.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HoldingService {

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private StockService stockService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private TransactionRepository transactionRepository;

    public List<Holding> getAllHoldings() {
        return holdingRepository.findAll();
    }

    public Optional<Holding> getHoldingById(Long id) {
        return holdingRepository.findById(id);
    }

    public List<Holding> getHoldingsByAssetType(String assetType) {
        return holdingRepository.findAll().stream()
                .filter(h -> h.getAssetType().equals(assetType))
                .collect(Collectors.toList());
    }

    /**
     * 获取或创建现金持仓
     */
    public Holding getCashHolding() {
        List<Holding> cashHoldings = getHoldingsByAssetType("CASH");
        if (!cashHoldings.isEmpty()) {
            return cashHoldings.get(0);
        }
        // 如果不存在现金持仓，创建一个
        Holding cash = new Holding();
        cash.setTicker("CASH");
        cash.setStockName("现金");
        cash.setVolume(0);
        cash.setAssetType("CASH");
        cash.setPurchasePrice(BigDecimal.ONE);
        cash.setPurchaseDate(LocalDate.now());
        cash.setCurrentPrice(BigDecimal.ONE);
        return holdingRepository.save(cash);
    }

    /**
     * 充值现金
     */
    public Holding depositCash(BigDecimal amount) {
        Holding cash = getCashHolding();
        cash.setVolume(cash.getVolume() + amount.intValue());
        holdingRepository.save(cash);

        // 创建充值交易记录
        transactionService.createDepositTransaction(cash, amount, "充值现金");

        return cash;
    }

    /**
     * 提取现金
     */
    public Holding withdrawCash(BigDecimal amount) {
        Holding cash = getCashHolding();
        if (cash.getVolume() < amount.intValue()) {
            throw new RuntimeException("现金余额不足");
        }
        cash.setVolume(cash.getVolume() - amount.intValue());
        holdingRepository.save(cash);

        // 创建提取交易记录
        transactionService.createWithdrawTransaction(cash, amount, "提取现金");

        return cash;
    }

    /**
     * 获取现金余额
     */
    public BigDecimal getCashBalance() {
        Holding cash = getCashHolding();
        return new BigDecimal(cash.getVolume());
    }

    /**
     * 买入股票或债券
     */
    public Holding buyStock(String ticker, Integer volume) {
        // 获取股票今日开盘价
        BigDecimal openPrice = stockService.getTodayOpenPrice(ticker);
        if (openPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("无法获取股票价格");
        }

        // 获取股票信息
        StockInfo stockInfo = stockService.getStockInfo(ticker);
        String stockName = stockInfo != null ? stockInfo.getName() : ticker;

        // 计算交易金额（不含手续费）
        BigDecimal amount = openPrice.multiply(new BigDecimal(volume));

        // 计算手续费（佣金万分之一 + 过户费万分之0.1 = 0.02%）
        BigDecimal feeRate = new BigDecimal("0.0002");
        BigDecimal fee = amount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);

        // 计算总金额
        BigDecimal totalAmount = amount.add(fee);

        // 检查现金余额
        Holding cash = getCashHolding();
        if (cash.getVolume() < totalAmount.intValue()) {
            throw new RuntimeException("现金余额不足，需要: " + totalAmount + "，当前: " + cash.getVolume());
        }

        // 判断资产类型
        String assetType = ticker.matches("\\d{6}") ? "STOCK" : "BOND";

        // 查找是否已存在该持仓
        Optional<Holding> existingHoldingOpt = holdingRepository.findAll().stream()
                .filter(h -> h.getAssetType().equals(assetType) && h.getTicker().equals(ticker))
                .findFirst();

        Holding holding;
        if (existingHoldingOpt.isPresent()) {
            // 如果存在，更新持仓（合并）
            holding = existingHoldingOpt.get();
            BigDecimal oldTotalCost = holding.getTotalCost();
            BigDecimal newTotalCost = oldTotalCost.add(totalAmount);
            holding.setVolume(holding.getVolume() + volume);
            holding.setPurchasePrice(newTotalCost.divide(new BigDecimal(holding.getVolume()), 4, RoundingMode.HALF_UP));
            holding.setCurrentPrice(openPrice);
            holding.setStockName(stockName);
            holdingRepository.save(holding);
        } else {
            // 如果不存在，创建新持仓
            holding = new Holding();
            holding.setTicker(ticker);
            holding.setStockName(stockName);
            holding.setVolume(volume);
            holding.setAssetType(assetType);
            holding.setPurchasePrice(totalAmount.divide(new BigDecimal(volume), 4, RoundingMode.HALF_UP));
            holding.setPurchaseDate(LocalDate.now());
            holding.setCurrentPrice(openPrice);
            holding = holdingRepository.save(holding);
        }

        // 扣除现金
        cash.setVolume(cash.getVolume() - totalAmount.intValue());
        holdingRepository.save(cash);

        // 创建买入交易记录
        transactionService.createBuyTransaction(holding, ticker, stockName, volume, openPrice, fee, totalAmount);

        return holding;
    }

    /**
     * 卖出股票或债券
     */
    public Holding sellStock(String ticker, Integer volume) {
        // 获取股票今日开盘价
        BigDecimal openPrice = stockService.getTodayOpenPrice(ticker);
        if (openPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("无法获取股票价格");
        }

        // 获取股票信息
        StockInfo stockInfo = stockService.getStockInfo(ticker);
        String stockName = stockInfo != null ? stockInfo.getName() : ticker;

        // 判断资产类型
        String assetType = ticker.matches("\\d{6}") ? "STOCK" : "BOND";

        // 查找持仓
        Optional<Holding> holdingOpt = holdingRepository.findAll().stream()
                .filter(h -> h.getAssetType().equals(assetType) && h.getTicker().equals(ticker))
                .findFirst();

        if (!holdingOpt.isPresent()) {
            throw new RuntimeException("不存在该持仓");
        }

        Holding holding = holdingOpt.get();

        if (holding.getVolume() < volume) {
            throw new RuntimeException("持仓数量不足");
        }

        // 计算交易金额（不含手续费）
        BigDecimal amount = openPrice.multiply(new BigDecimal(volume));

        // 计算手续费（佣金万分之一 + 印花税万分之五 + 过户费万分之0.1 = 0.07%）
        BigDecimal feeRate = new BigDecimal("0.0007");
        BigDecimal fee = amount.multiply(feeRate).setScale(2, RoundingMode.HALF_UP);

        // 计算实际到账金额
        BigDecimal netAmount = amount.subtract(fee);

        // 计算收益（卖出金额 - 买入成本）
        BigDecimal avgCost = holding.getPurchasePrice();
        BigDecimal totalCost = avgCost.multiply(new BigDecimal(volume));
        BigDecimal profitLoss = netAmount.subtract(totalCost);

        // 更新持仓
        if (holding.getVolume() == volume) {
            // 如果全部卖出，删除持仓
            holdingRepository.delete(holding);
        } else {
            holding.setVolume(holding.getVolume() - volume);
            holdingRepository.save(holding);
        }

        // 增加现金
        Holding cash = getCashHolding();
        cash.setVolume(cash.getVolume() + netAmount.intValue());
        holdingRepository.save(cash);

        // 创建卖出交易记录
        transactionService.createSellTransaction(holding, ticker, stockName, volume, openPrice, fee, amount, profitLoss);

        return holding.getVolume() > 0 ? holding : null;
    }

    /**
     * 创建持仓（仅用于初始化，现在只允许添加现金）
     * @deprecated 使用 depositCash() 方法
     */
    @Deprecated
    public Holding createHolding(Holding holding) {
        // 只允许创建现金持仓
        if (!"CASH".equals(holding.getAssetType())) {
            throw new RuntimeException("现在只能通过买入功能添加股票或债券，请使用买入接口");
        }
        return holdingRepository.save(holding);
    }

    public Holding updateHolding(Long id, Holding holdingDetails) {
        return holdingRepository.findById(id).map(holding -> {
            holding.setTicker(holdingDetails.getTicker());
            holding.setStockName(holdingDetails.getStockName());
            holding.setVolume(holdingDetails.getVolume());
            holding.setAssetType(holdingDetails.getAssetType());
            holding.setPurchasePrice(holdingDetails.getPurchasePrice());
            holding.setPurchaseDate(holdingDetails.getPurchaseDate());
            holding.setCurrentPrice(holdingDetails.getCurrentPrice());
            return holdingRepository.save(holding);
        }).orElse(null);
    }

    public boolean deleteHolding(Long id) {
        if (holdingRepository.existsById(id)) {
            // 先删除所有关联的交易记录
            List<Transaction> transactions = transactionRepository.findByHoldingId(id);
            for (Transaction transaction : transactions) {
                transactionRepository.delete(transaction);
            }

            // 然后删除持仓
            holdingRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public PortfolioSummary getPortfolioSummary() {
        List<Holding> holdings = getAllHoldings();

        BigDecimal totalValue = holdings.stream()
                .map(Holding::getTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCost = holdings.stream()
                .map(Holding::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfitLoss = holdings.stream()
                .map(Holding::getProfitLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfitLossPercentage = totalCost.compareTo(BigDecimal.ZERO) != 0
                ? totalProfitLoss.divide(totalCost, 4, RoundingMode.HALF_UP)
                                .multiply(new BigDecimal(100))
                : BigDecimal.ZERO;

        long stockCount = holdings.stream()
                .filter(h -> "STOCK".equals(h.getAssetType()))
                .count();

        long bondCount = holdings.stream()
                .filter(h -> "BOND".equals(h.getAssetType()))
                .count();

        long cashCount = holdings.stream()
                .filter(h -> "CASH".equals(h.getAssetType()))
                .count();

        return new PortfolioSummary(
                (long) holdings.size(),
                totalValue,
                totalCost,
                totalProfitLoss,
                totalProfitLossPercentage,
                stockCount,
                bondCount,
                cashCount
        );
    }

    /**
     * 更新持仓价格为今日开盘价
     */
    public Holding updateHoldingPriceToTodayOpen(Long id) {
        return holdingRepository.findById(id).map(holding -> {
            if ("STOCK".equals(holding.getAssetType()) || "BOND".equals(holding.getAssetType())) {
                BigDecimal openPrice = stockService.getTodayOpenPrice(holding.getTicker());
                if (openPrice.compareTo(BigDecimal.ZERO) > 0) {
                    holding.setCurrentPrice(openPrice);
                    return holdingRepository.save(holding);
                }
            }
            return holding;
        }).orElse(null);
    }

    /**
     * 更新所有股票/债券持仓价格为今日开盘价
     */
    public void updateAllStockPricesToTodayOpen() {
        List<Holding> holdings = holdingRepository.findAll();
        for (Holding holding : holdings) {
            if ("STOCK".equals(holding.getAssetType()) || "BOND".equals(holding.getAssetType())) {
                try {
                    updateHoldingPriceToTodayOpen(holding.getId());
                } catch (Exception e) {
                    System.err.println("Failed to update price for " + holding.getTicker() + ": " + e.getMessage());
                }
            }
        }
    }

    public Holding updateCurrentPrice(Long id, BigDecimal currentPrice) {
        return holdingRepository.findById(id).map(holding -> {
            holding.setCurrentPrice(currentPrice);
            return holdingRepository.save(holding);
        }).orElse(null);
    }
}
