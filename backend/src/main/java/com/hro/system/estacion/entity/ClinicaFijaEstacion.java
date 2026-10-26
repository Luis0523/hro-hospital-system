package com.hro.system.estacion.entity;

import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.espacio.entity.EspacioFisico;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "clinica_fija_estacion",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_clinica_fija_estacion_especialidad",
                columnNames = {"estacion_id", "especialidad_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicaFijaEstacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especialidad_id", nullable = false)
    private Especialidad especialidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_fisico_id", nullable = false)
    private EspacioFisico espacioFisico;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}
