package com.drake.service;

import com.drake.model.Holding;
import com.drake.model.Transaction;
import com.drake.repository.HoldingRepository;
import com.drake.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public List<Transaction> getTransactionsByHoldingId(Long holdingId) {
        return transactionRepository.findByHoldingIdOrderByTransactionDateDesc(holdingId);
    }

    public Optional<Transaction> getTransactionById(Long id) {
        return transactionRepository.findById(id);
    }

    public Transaction createTransaction(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    public Transaction createBuyTransaction(Long holdingId, Integer volume, BigDecimal price) {
        Optional<Holding> holdingOpt = holdingRepository.findById(holdingId);
        if (holdingOpt.isPresent()) {
            Holding holding = holdingOpt.get();

            Transaction transaction = new Transaction();
            transaction.setHolding(holding);
            transaction.setTransactionType("BUY");
            transaction.setVolume(volume);
            transaction.setPrice(price);
            transaction.setTransactionDate(LocalDateTime.now());

            Transaction savedTransaction = transactionRepository.save(transaction);

            // Update holding volume
            holding.setVolume(holding.getVolume() + volume);
            holdingRepository.save(holding);

            return savedTransaction;
        }
        return null;
    }

    public Transaction createSellTransaction(Long holdingId, Integer volume, BigDecimal price) {
        Optional<Holding> holdingOpt = holdingRepository.findById(holdingId);
        if (holdingOpt.isPresent()) {
            Holding holding = holdingOpt.get();

            if (holding.getVolume() < volume) {
                throw new RuntimeException("Insufficient volume to sell");
            }

            Transaction transaction = new Transaction();
            transaction.setHolding(holding);
            transaction.setTransactionType("SELL");
            transaction.setVolume(volume);
            transaction.setPrice(price);
            transaction.setTransactionDate(LocalDateTime.now());

            Transaction savedTransaction = transactionRepository.save(transaction);

            // Update holding volume
            holding.setVolume(holding.getVolume() - volume);
            holdingRepository.save(holding);

            return savedTransaction;
        }
        return null;
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
