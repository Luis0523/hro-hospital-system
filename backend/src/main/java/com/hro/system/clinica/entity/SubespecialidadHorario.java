package com.hro.system.clinica.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Horario semanal (días y horas) y capacidad diaria por subespecialidad,
 * independiente del médico. De aquí cuelgan los cupos diarios.
 */
@Entity
@Table(name = "subespecialidad_horario", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"subespecialidad_id", "dia_semana"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubespecialidadHorario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_id", nullable = false)
    private Subespecialidad subespecialidad;

    /** 1 = Lunes ... 7 = Domingo */
    @Column(name = "dia_semana", nullable = false)
    private Short diaSemana;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Column(name = "capacidad_maxima", nullable = false)
    private Integer capacidadMaxima;

    @Column(name = "duracion_consulta_minutos", nullable = false)
    @Builder.Default
    private Integer duracionConsultaMinutos = 35;

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
