package com.hro.system.espacio.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Ruta del archivo SVG del plano por nivel. Es un recurso compartido por todas
 * las salas de ese nivel (no se repite en cada espacio_fisico).
 */
@Entity
@Table(name = "plano_hospital", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"nivel"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanoHospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nivel", nullable = false)
    private Short nivel;

    @Column(name = "archivo_svg", nullable = false, length = 255)
    private String archivoSvg;

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}
