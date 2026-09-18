package com.hro.system.agenda.entity;

import com.hro.system.medico.entity.MedicoSubespecialidad;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "cupo_diario", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"medico_subespecialidad_id", "fecha"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CupoDiario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_subespecialidad_id", nullable = false)
    private MedicoSubespecialidad medicoSubespecialidad;

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
