package com.hro.system.estacion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Estación de enfermería: puesto de trabajo que agrupa subespecialidades.
 * Su tablero de turnos muestra únicamente las áreas (subespecialidades) que tiene a cargo.
 */
@Entity
@Table(name = "estacion_enfermeria", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"codigo"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstacionEnfermeria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, length = 30)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "ubicacion", length = 150)
    private String ubicacion;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}
