package com.hro.system.laboratorio.entity;

import com.hro.system.cita.entity.Cita;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "orden_laboratorio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenLaboratorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_examen_id", nullable = false)
    private TipoExamenLaboratorio tipoExamen;

    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private String estado = "pendiente"; // pendiente, enviada, procesada, resultado_recibido

    @Column(name = "fecha_orden", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime fechaOrden = OffsetDateTime.now();

    @Column(name = "fecha_toma_muestra_programada")
    private LocalDate fechaTomaMuestraProgramada;

    @Column(name = "prioridad", nullable = false, length = 10)
    @Builder.Default
    private String prioridad = "normal"; // normal, urgente
}
