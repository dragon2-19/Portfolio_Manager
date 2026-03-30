package com.drake.controller;

import com.drake.model.Holding;
import com.drake.service.HoldingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/holdings")
@CrossOrigin(origins = "*")
public class HoldingController {

    @Autowired
    private HoldingService holdingService;

    @GetMapping
    public ResponseEntity<List<Holding>> getAllHoldings() {
        List<Holding> holdings = holdingService.getAllHoldings();
        return ResponseEntity.ok(holdings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Holding> getHoldingById(@PathVariable Long id) {
        Optional<Holding> holding = holdingService.getHoldingById(id);
        return holding.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Holding> createHolding(@RequestBody Holding holding) {
        Holding createdHolding = holdingService.createHolding(holding);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdHolding);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Holding> updateHolding(@PathVariable Long id, @RequestBody Holding holding) {
        Holding updatedHolding = holdingService.updateHolding(id, holding);
        if (updatedHolding != null) {
            return ResponseEntity.ok(updatedHolding);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHolding(@PathVariable Long id) {
        boolean deleted = holdingService.deleteHolding(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
