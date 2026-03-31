package com.drake.service;

import com.drake.dto.PortfolioSummary;
import com.drake.model.Holding;
import com.drake.repository.HoldingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HoldingService {

    @Autowired
    private HoldingRepository holdingRepository;

    public List<Holding> getAllHoldings() {
        return holdingRepository.findAll();
    }

    public Optional<Holding> getHoldingById(Long id) {
        return holdingRepository.findById(id);
    }

    public List<Holding> getHoldingsByAssetType(String assetType) {
        return holdingRepository.findAll().stream()
                .filter(h -> h.getAssetType().equals(assetType))
                .collect(Collectors.toList());
    }

    public Holding createHolding(Holding holding) {
        return holdingRepository.save(holding);
    }

    public Holding updateHolding(Long id, Holding holdingDetails) {
        return holdingRepository.findById(id).map(holding -> {
            holding.setTicker(holdingDetails.getTicker());
            holding.setVolume(holdingDetails.getVolume());
            holding.setAssetType(holdingDetails.getAssetType());
            holding.setPurchasePrice(holdingDetails.getPurchasePrice());
            holding.setPurchaseDate(holdingDetails.getPurchaseDate());
            holding.setCurrentPrice(holdingDetails.getCurrentPrice());
            return holdingRepository.save(holding);
        }).orElse(null);
    }

    public boolean deleteHolding(Long id) {
        if (holdingRepository.existsById(id)) {
            holdingRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public PortfolioSummary getPortfolioSummary() {
        List<Holding> holdings = getAllHoldings();

        BigDecimal totalValue = holdings.stream()
                .map(Holding::getTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCost = holdings.stream()
                .map(Holding::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfitLoss = holdings.stream()
                .map(Holding::getProfitLoss)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProfitLossPercentage = totalCost.compareTo(BigDecimal.ZERO) != 0
                ? totalProfitLoss.divide(totalCost, 4, RoundingMode.HALF_UP)
                                .multiply(new BigDecimal(100))
                : BigDecimal.ZERO;

        long stockCount = holdings.stream()
                .filter(h -> "STOCK".equals(h.getAssetType()))
                .count();

        long bondCount = holdings.stream()
                .filter(h -> "BOND".equals(h.getAssetType()))
                .count();

        long cashCount = holdings.stream()
                .filter(h -> "CASH".equals(h.getAssetType()))
                .count();

        return new PortfolioSummary(
                (long) holdings.size(),
                totalValue,
                totalCost,
                totalProfitLoss,
                totalProfitLossPercentage,
                stockCount,
                bondCount,
                cashCount
        );
    }

    public Holding updateCurrentPrice(Long id, BigDecimal currentPrice) {
        return holdingRepository.findById(id).map(holding -> {
            holding.setCurrentPrice(currentPrice);
            return holdingRepository.save(holding);
        }).orElse(null);
    }
}
