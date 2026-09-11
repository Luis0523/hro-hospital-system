package com.hro.system.cita.entity;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "cita")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cupo_diario_id", nullable = false)
    private CupoDiario cupoDiario;

    @Column(name = "hora_estimada")
    private LocalTime horaEstimada;

    @Column(name = "hora_ventana_inicio")
    private LocalTime horaVentanaInicio;

    @Column(name = "hora_ventana_fin")
    private LocalTime horaVentanaFin;

    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private String estado = "pendiente"; // pendiente, confirmada, atendida, cancelada, reprogramada, no_asistio

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_origen_id")
    private Cita citaOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por", nullable = false)
    private UsuarioReferencia registradoPor;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 0;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}
