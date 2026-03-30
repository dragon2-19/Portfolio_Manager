package com.drake.service;

import com.drake.model.Holding;
import com.drake.repository.HoldingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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

    public Holding createHolding(Holding holding) {
        return holdingRepository.save(holding);
    }

    public Holding updateHolding(Long id, Holding holdingDetails) {
        return holdingRepository.findById(id).map(holding -> {
            holding.setTicker(holdingDetails.getTicker());
            holding.setVolume(holdingDetails.getVolume());
            holding.setAssetType(holdingDetails.getAssetType());
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
}
