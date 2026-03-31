package com.drake.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holding_id", nullable = true)
    @JsonIgnore
    private Holding holding;

    @Column(name = "ticker", length = 20)
    private String ticker;

    @Column(length = 50)
    private String stockName;

    @Column(name = "transaction_type", nullable = false, length = 10)
    private String transactionType; // BUY or SELL or DEPOSIT or WITHDRAW

    @Column(nullable = false)
    private Integer volume;

    @Column(name = "price", precision = 19, scale = 4, nullable = false)
    private BigDecimal price;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(precision = 19, scale = 4)
    private BigDecimal fee;

    @Column(name = "profit_loss", precision = 19, scale = 4)
    private BigDecimal profitLoss;
}
