package com.hro.system.turnoestacion.entity;

import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "devolucion_clinica")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevolucionClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_fisico_id", nullable = false)
    private EspacioFisico espacioFisico;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_referencia_id")
    private UsuarioReferencia usuario;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @Column(name = "revertido_en")
    private OffsetDateTime revertidoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revertido_por_id")
    private UsuarioReferencia revertidoPor;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;
}
