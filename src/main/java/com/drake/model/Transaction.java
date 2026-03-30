package com.drake.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holding_id", nullable = false)
    private Holding holding;

    @Column(name = "transaction_type", nullable = false, length = 10)
    private String transactionType; // BUY or SELL

    @Column(nullable = false)
    private Integer volume;

    @Column(name = "price", precision = 19, scale = 4, nullable = false)
    private BigDecimal price;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @PrePersist
    @PreUpdate
    protected void preSave() {
        // 计算总金额
        if (volume != null && price != null) {
            this.totalAmount = price.multiply(new BigDecimal(volume));
        }

        // 设置默认日期
        if (transactionDate == null) {
            this.transactionDate = LocalDateTime.now();
        }
    }
}
