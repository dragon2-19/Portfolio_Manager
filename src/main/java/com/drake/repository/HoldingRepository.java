package com.drake.repository;

import com.drake.model.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {

    List<Holding> findByAssetType(String assetType);

    @Query("SELECT h FROM Holding h WHERE h.ticker = :ticker")
    Optional<Holding> findByTicker(@Param("ticker") String ticker);

    @Query("SELECT SUM(h.volume) FROM Holding h WHERE h.assetType = :assetType")
    Long getTotalVolumeByAssetType(@Param("assetType") String assetType);
}
