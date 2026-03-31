package com.drake.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "holding")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String ticker;

    @Column(nullable = false)
    private Integer volume;

    @Column(name = "asset_type", nullable = false, length = 10)
    private String assetType;

    @Column(name = "purchase_price", precision = 19, scale = 4)
    private BigDecimal purchasePrice;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "current_price", precision = 19, scale = 4)
    private BigDecimal currentPrice;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    public BigDecimal getTotalValue() {
        if (currentPrice != null && volume != null) {
            return currentPrice.multiply(new BigDecimal(volume));
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal getTotalCost() {
        if (purchasePrice != null && volume != null) {
            return purchasePrice.multiply(new BigDecimal(volume));
        }
        return BigDecimal.ZERO;
    }

    public BigDecimal getProfitLoss() {
        return getTotalValue().subtract(getTotalCost());
    }

    public BigDecimal getProfitLossPercentage() {
        BigDecimal totalCost = getTotalCost();
        if (totalCost.compareTo(BigDecimal.ZERO) != 0) {
            return getProfitLoss().divide(totalCost, 4, RoundingMode.HALF_UP)
                                .multiply(new BigDecimal(100));
        }
        return BigDecimal.ZERO;
    }
}
