package com.hro.system.medico.entity;

import com.hro.system.clinica.entity.Subespecialidad;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Programación médica por subespecialidad: qué médico atiende qué subespecialidad,
 * qué día de la semana, con qué horario y capacidad.
 * <p>
 * NO referencia una sala física: la sala se resuelve por día vía
 * {@code asignacion_diaria_espacio}, cruzando por subespecialidad y fecha.
 */
@Entity
@Table(name = "medico_subespecialidad", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"medico_id", "subespecialidad_id", "dia_semana"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicoSubespecialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_id", nullable = false)
    private Subespecialidad subespecialidad;

    @Column(name = "dia_semana", nullable = false)
    private Short diaSemana; // 1 = Lunes ... 7 = Domingo

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
}
