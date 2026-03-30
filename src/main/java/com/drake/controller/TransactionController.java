package com.drake.controller;

import com.drake.model.Transaction;
import com.drake.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        Optional<Transaction> transaction = transactionService.getTransactionById(id);
        return transaction.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/holding/{holdingId}")
    public ResponseEntity<List<Transaction>> getTransactionsByHoldingId(@PathVariable Long holdingId) {
        List<Transaction> transactions = transactionService.getTransactionsByHoldingId(holdingId);
        return ResponseEntity.ok(transactions);
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody Transaction transaction) {
        Transaction createdTransaction = transactionService.createTransaction(transaction);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTransaction);
    }

    @PostMapping("/buy")
    public ResponseEntity<Transaction> createBuyTransaction(
            @RequestParam Long holdingId,
            @RequestParam Integer volume,
            @RequestParam BigDecimal price) {
        Transaction transaction = transactionService.createBuyTransaction(holdingId, volume, price);
        if (transaction != null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/sell")
    public ResponseEntity<Transaction> createSellTransaction(
            @RequestParam Long holdingId,
            @RequestParam Integer volume,
            @RequestParam BigDecimal price) {
        try {
            Transaction transaction = transactionService.createSellTransaction(holdingId, volume, price);
            if (transaction != null) {
                return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
            }
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        boolean deleted = transactionService.deleteTransaction(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Transaction>> getRecentTransactions(
            @RequestParam(defaultValue = "7") int days) {
        List<Transaction> transactions = transactionService.getRecentTransactions(days);
        return ResponseEntity.ok(transactions);
    }
}
