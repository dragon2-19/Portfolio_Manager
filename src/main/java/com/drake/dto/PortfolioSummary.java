package com.drake.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSummary {

    private Long totalHoldings;
    private BigDecimal totalValue;
    private BigDecimal totalCost;
    private BigDecimal totalProfitLoss;
    private BigDecimal totalProfitLossPercentage;
    private Long stockCount;
    private Long bondCount;
    private Long cashCount;
}
