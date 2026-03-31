package com.drake.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockInfo {

    private String ticker;
    private String name;
    private BigDecimal currentPrice;
    private BigDecimal change;
    private BigDecimal changePercent;
    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    private Long volume;
    private BigDecimal marketCap;
    private LocalDateTime lastUpdated;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceHistoryPoint {
        private String date;
        private BigDecimal price;
        private BigDecimal open;
        private BigDecimal high;
        private BigDecimal low;

        // Two-argument constructor for backward compatibility
        public PriceHistoryPoint(String date, BigDecimal price) {
            this.date = date;
            this.price = price;
            this.open = null;
            this.high = null;
            this.low = null;
        }

        // Three-argument constructor for backward compatibility
        public PriceHistoryPoint(String date, BigDecimal price, BigDecimal open) {
            this.date = date;
            this.price = price;
            this.open = open;
            this.high = null;
            this.low = null;
        }
    }

    private List<PriceHistoryPoint> priceHistory;
}
