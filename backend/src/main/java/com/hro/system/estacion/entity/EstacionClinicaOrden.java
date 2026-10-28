package com.hro.system.estacion.entity;

import com.hro.system.espacio.entity.EspacioFisico;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "estacion_clinica_orden",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_estacion_clinica_orden",
                columnNames = {"estacion_id", "espacio_fisico_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstacionClinicaOrden {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_fisico_id", nullable = false)
    private EspacioFisico espacioFisico;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}
