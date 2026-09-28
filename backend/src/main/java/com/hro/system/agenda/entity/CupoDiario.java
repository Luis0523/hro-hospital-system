package com.hro.system.agenda.entity;

import com.hro.system.clinica.entity.SubespecialidadHorario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cupo_diario", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"subespecialidad_horario_id", "fecha"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CupoDiario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_horario_id", nullable = false)
    private SubespecialidadHorario subespecialidadHorario;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "capacidad_maxima", nullable = false)
    private Integer capacidadMaxima;

    @Column(name = "cupos_ocupados", nullable = false)
    @Builder.Default
    private Integer cuposOcupados = 0;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}
