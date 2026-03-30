package com.drake.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "holding")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Holding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ticker;

    @Column(nullable = false)
    private Integer volume;

    @Column(name = "asset_type", nullable = false)
    private String assetType;
}
