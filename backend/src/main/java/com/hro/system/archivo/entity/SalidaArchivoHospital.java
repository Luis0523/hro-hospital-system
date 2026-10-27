package com.hro.system.archivo.entity;

import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Expediente que sale de archivo consultando DIRECTAMENTE el API del hospital
 * (Registro Médico). Es un registro propio de Archivo, compartido por estación y
 * fecha, independiente de los carnets de enfermería.
 */
@Entity
@Table(name = "salida_archivo_hospital",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_salida_hosp_fecha_estacion_exp",
                columnNames = {"fecha", "estacion_id", "numero_expediente"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalidaArchivoHospital {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id")
    private EstacionEnfermeria estacion;

    @Column(name = "numero_expediente", nullable = false, length = 30)
    private String numeroExpediente;

    @Column(name = "paciente_nombre", nullable = false, length = 200)
    private String pacienteNombre;

    @Column(name = "es_clinica_mujer", nullable = false)
    @Builder.Default
    private boolean esClinicaMujer = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id")
    private UsuarioReferencia registradoPor;

    @Column(name = "registrado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime registradoEn = OffsetDateTime.now();
}
