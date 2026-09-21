package com.hro.system.archivo.entity;

import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Bitácora detallada de cada checkpoint del recorrido del ciclo.
 * Es append-only: nunca se actualiza ni se borra.
 */
@Entity
@Table(name = "expediente_movimiento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpedienteMovimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediente_ciclo_id", nullable = false)
    private ExpedienteCiclo expedienteCiclo;

    @Column(name = "estado_anterior", length = 25)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", nullable = false, length = 25)
    private String estadoNuevo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacion_origen_id")
    private UbicacionArchivo ubicacionOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacion_destino_id")
    private UbicacionArchivo ubicacionDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_referencia_id", nullable = false)
    private UsuarioReferencia usuarioReferencia;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "fecha_movimiento", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime fechaMovimiento = OffsetDateTime.now();
}
