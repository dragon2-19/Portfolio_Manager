package com.drake.repository;

import com.drake.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByHoldingId(Long holdingId);

    List<Transaction> findByHoldingIdOrderByTransactionDateDesc(Long holdingId);

    @Query("SELECT t FROM Transaction t WHERE t.holding.id = :holdingId AND t.transactionType = :type")
    List<Transaction> findByHoldingIdAndType(@Param("holdingId") Long holdingId, @Param("type") String type);

    @Query("SELECT t FROM Transaction t WHERE t.transactionDate >= :startDate")
    List<Transaction> findTransactionsAfterDate(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.holding IS NOT NULL AND t.holding.id = :holdingId")
    Long countByHoldingId(@Param("holdingId") Long holdingId);
}
