package com.hro.system.estacion.entity;

import com.hro.system.clinica.entity.Subespecialidad;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Subespecialidad a cargo de una estación. Pertenencia única:
 * una subespecialidad no puede repartirse entre estaciones.
 */
@Entity
@Table(name = "estacion_subespecialidad", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"estacion_id", "subespecialidad_id"}),
        @UniqueConstraint(columnNames = {"subespecialidad_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstacionSubespecialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_id", nullable = false)
    private Subespecialidad subespecialidad;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}
