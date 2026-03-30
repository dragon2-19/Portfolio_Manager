package com.drake.repository;

import com.drake.model.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {
}
