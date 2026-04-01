package com.drake.service;

import com.drake.model.Holding;
import com.drake.model.Transaction;
import com.drake.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(rollbackFor = Exception.class)
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByHoldingId(Long holdingId) {
        return transactionRepository.findByHoldingIdOrderByTransactionDateDesc(holdingId);
    }

    @Transactional(readOnly = true)
    public Optional<Transaction> getTransactionById(Long id) {
        return transactionRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Transaction createTransaction(Transaction transaction) {
        if (transaction.getTransactionDate() == null) {
            transaction.setTransactionDate(LocalDateTime.now());
        }
        return transactionRepository.save(transaction);
    }

    /**
     * 创建买入交易记录
     */
    public Transaction createBuyTransaction(Holding holding, String ticker, String stockName,
                                           Integer volume, BigDecimal price,
                                           BigDecimal fee, BigDecimal totalAmount, LocalDate transactionDate) {
        Transaction transaction = new Transaction();
        transaction.setHolding(holding);
        transaction.setTicker(ticker);
        transaction.setStockName(stockName);
        transaction.setTransactionType("BUY");
        transaction.setVolume(volume);
        transaction.setPrice(price);
        transaction.setTotalAmount(totalAmount);
        transaction.setFee(fee);
        transaction.setProfitLoss(BigDecimal.ZERO);
        transaction.setTransactionDate(transactionDate != null ? transactionDate.atStartOfDay() : LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    /**
     * 创建卖出交易记录
     */
    public Transaction createSellTransaction(Holding holding, String ticker, String stockName,
                                            Integer volume, BigDecimal price,
                                            BigDecimal fee, BigDecimal totalAmount, BigDecimal profitLoss, LocalDate transactionDate) {
        Transaction transaction = new Transaction();
        transaction.setHolding(holding);
        transaction.setTicker(ticker);
        transaction.setStockName(stockName);
        transaction.setTransactionType("SELL");
        transaction.setVolume(volume);
        transaction.setPrice(price);
        transaction.setTotalAmount(totalAmount);
        transaction.setFee(fee);
        transaction.setProfitLoss(profitLoss);
        transaction.setTransactionDate(transactionDate != null ? transactionDate.atStartOfDay() : LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    /**
     * 创建充值交易记录
     */
    public Transaction createDepositTransaction(Holding holding, BigDecimal amount, String remark) {
        Transaction transaction = new Transaction();
        transaction.setHolding(holding);
        transaction.setTransactionType("DEPOSIT");
        transaction.setVolume(amount.intValue());
        transaction.setPrice(BigDecimal.ONE);
        transaction.setTotalAmount(amount);
        transaction.setFee(BigDecimal.ZERO);
        transaction.setProfitLoss(BigDecimal.ZERO);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setTicker("CASH");
        transaction.setStockName("现金");

        return transactionRepository.save(transaction);
    }

    /**
     * 创建提取交易记录
     */
    public Transaction createWithdrawTransaction(Holding holding, BigDecimal amount, String remark) {
        Transaction transaction = new Transaction();
        transaction.setHolding(holding);
        transaction.setTransactionType("WITHDRAW");
        transaction.setVolume(amount.intValue());
        transaction.setPrice(BigDecimal.ONE);
        transaction.setTotalAmount(amount);
        transaction.setFee(BigDecimal.ZERO);
        transaction.setProfitLoss(BigDecimal.ZERO);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setTicker("CASH");
        transaction.setStockName("现金");

        return transactionRepository.save(transaction);
    }

    public boolean deleteTransaction(Long id) {
        if (transactionRepository.existsById(id)) {
            transactionRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<Transaction> getRecentTransactions(int limit) {
        return transactionRepository.findTransactionsAfterDate(LocalDateTime.now().minusDays(limit))
                                    .stream()
                                    .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
                                    .limit(limit)
                                    .toList();
    }
}
