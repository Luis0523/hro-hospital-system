package com.hro.system.carnet.entity;

import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Carnet recibido por la estación de enfermería. La identidad del carnet es el
 * número de expediente del hospital más el correlativo diario por especialidad.
 * El expediente/ciclo local se enlazan cuando estén disponibles (nullable).
 */
@Entity
@Table(name = "carnet")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Carnet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "correlativo", nullable = false)
    private Integer correlativo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especialidad_id", nullable = false)
    private Especialidad especialidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id")
    private EstacionEnfermeria estacion;

    @Column(name = "numero_expediente", nullable = false, length = 30)
    private String numeroExpediente;

    @Column(name = "paciente_nombre", nullable = false, length = 200)
    private String pacienteNombre;

    @Column(name = "paciente_id")
    private UUID pacienteId;

    @Column(name = "expediente_id")
    private UUID expedienteId;

    @Column(name = "cita_id")
    private Long citaId;

    @Column(name = "ciclo_id")
    private UUID cicloId;

    @Column(name = "estado", nullable = false, length = 30)
    @Builder.Default
    private String estado = "registrado";

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id")
    private UsuarioReferencia registradoPor;

    @Column(name = "registrado_en", nullable = false)
    private OffsetDateTime registradoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encontrado_por_id")
    private UsuarioReferencia encontradoPor;

    @Column(name = "encontrado_en")
    private OffsetDateTime encontradoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "no_localizado_por_id")
    private UsuarioReferencia noLocalizadoPor;

    @Column(name = "no_localizado_en")
    private OffsetDateTime noLocalizadoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "despachado_por_id")
    private UsuarioReferencia despachadoPor;

    @Column(name = "despachado_en")
    private OffsetDateTime despachadoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recibido_por_id")
    private UsuarioReferencia recibidoPor;

    @Column(name = "recibido_en")
    private OffsetDateTime recibidoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devuelto_por_id")
    private UsuarioReferencia devueltoPor;

    @Column(name = "devuelto_en")
    private OffsetDateTime devueltoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recibido_archivo_por_id")
    private UsuarioReferencia recibidoArchivoPor;

    @Column(name = "recibido_archivo_en")
    private OffsetDateTime recibidoArchivoEn;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}
