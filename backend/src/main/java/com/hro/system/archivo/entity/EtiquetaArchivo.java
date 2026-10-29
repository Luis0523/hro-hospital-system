package com.hro.system.archivo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Etiqueta operativa del módulo de Archivo (p. ej. "Clínica de la Mujer").
 * Se administra desde la jefatura de Archivo y se asigna por estación.
 */
@Entity
@Table(name = "etiqueta_archivo",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_etiqueta_archivo_codigo",
                columnNames = {"codigo"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtiquetaArchivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, length = 40)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 80)
    private String nombre;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "icono", nullable = false, length = 40)
    @Builder.Default
    private String icono = "label";

    @Column(name = "color", nullable = false, length = 20)
    @Builder.Default
    private String color = "primary";

    @Column(name = "orden", nullable = false)
    @Builder.Default
    private Integer orden = 0;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}
