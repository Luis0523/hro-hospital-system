package com.hro.system.archivo.entity;

import com.hro.system.estacion.entity.EstacionEnfermeria;
import jakarta.persistence.*;
import lombok.*;

/**
 * Etiqueta habilitada en una estación. Al desasignarla se marca {@code activo = false}
 * en lugar de borrar la fila, para conservar la configuración histórica.
 */
@Entity
@Table(name = "estacion_etiqueta_archivo",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_estacion_etiqueta_archivo",
                columnNames = {"estacion_id", "etiqueta_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstacionEtiquetaArchivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etiqueta_id", nullable = false)
    private EtiquetaArchivo etiqueta;

    @Column(name = "orden", nullable = false)
    @Builder.Default
    private Integer orden = 0;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
