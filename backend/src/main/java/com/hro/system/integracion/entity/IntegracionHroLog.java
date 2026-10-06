package com.hro.system.integracion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Bitácora de cada llamada al API externo del hospital (auditoría de integración).
 * Se registra siempre, con éxito o error, guardando la respuesta cruda.
 */
@Entity
@Table(name = "integracion_hro_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegracionHroLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_expediente", length = 30)
    private String numeroExpediente;

    @Column(name = "url", columnDefinition = "TEXT")
    private String url;

    @Column(name = "metodo", length = 10)
    private String metodo;

    @Column(name = "estado_http")
    private Integer estadoHttp;

    @Column(name = "exitoso", nullable = false)
    @Builder.Default
    private Boolean exitoso = false;

    @Column(name = "duracion_ms")
    private Long duracionMs;

    /** Respuesta cruda del API (JSON FHIR). */
    @Column(name = "respuesta", columnDefinition = "TEXT")
    private String respuesta;

    @Column(name = "error", columnDefinition = "TEXT")
    private String error;

    @Column(name = "usuario_referencia_id")
    private Long usuarioReferenciaId;

    @Column(name = "fecha", nullable = false)
    @Builder.Default
    private OffsetDateTime fecha = OffsetDateTime.now();
}
