package com.hro.system.turno.entity;

import com.hro.system.clinica.entity.Clinica;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contador_turno_diario", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"clinica_id", "fecha"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContadorTurnoDiario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinica_id", nullable = false)
    private Clinica clinica;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "turno_actual", nullable = false)
    @Builder.Default
    private Integer turnoActual = 0;

    @Column(name = "turno_siguiente", nullable = false)
    @Builder.Default
    private Integer turnoSiguiente = 1;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}
