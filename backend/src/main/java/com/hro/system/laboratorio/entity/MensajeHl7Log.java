package com.hro.system.laboratorio.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "mensaje_hl7_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensajeHl7Log {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orden_laboratorio_id")
    private OrdenLaboratorio ordenLaboratorio;

    @Column(name = "direccion", nullable = false, length = 10)
    private String direccion; // 'enviado' o 'recibido'

    @Column(name = "contenido_crudo", nullable = false, columnDefinition = "TEXT")
    private String contenidoCrudo;

    @Column(name = "estado_procesamiento", nullable = false, length = 15)
    @Builder.Default
    private String estadoProcesamiento = "ok"; // ok, error, reintentando

    @Column(name = "fecha", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime fecha = OffsetDateTime.now();
}
