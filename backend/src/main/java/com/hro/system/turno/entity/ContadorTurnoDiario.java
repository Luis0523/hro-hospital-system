package com.hro.system.turno.entity;

import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Correlativo de turnos por asignación diaria (espacio físico + subespecialidad + fecha).
 * La fecha queda implícita en la asignación.
 */
@Entity
@Table(name = "contador_turno_diario", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"asignacion_diaria_espacio_id"})
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
    @JoinColumn(name = "asignacion_diaria_espacio_id")
    private AsignacionDiariaEspacio asignacionDiariaEspacio;

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
