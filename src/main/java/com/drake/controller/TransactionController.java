package com.drake.controller;

import com.drake.model.Transaction;
import com.drake.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /**
     * 创建交易记录（通用接口）
     * 注意：交易记录通常通过买入/卖出操作自动创建，此接口仅用于特殊情况
     */
    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody Transaction transaction) {
        Transaction createdTransaction = transactionService.createTransaction(transaction);
        return ResponseEntity.ok(createdTransaction);
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
