package com.hro.system.archivo.entity;

import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "salida_enfermeria_archivo",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_salida_enf_fecha_estacion_exp",
                columnNames = {"fecha", "estacion_id", "numero_expediente"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalidaEnfermeriaArchivo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @Column(name = "numero_expediente", nullable = false, length = 30)
    private String numeroExpediente;

    @Column(name = "paciente_nombre", nullable = false, length = 200)
    private String pacienteNombre;

    @Column(name = "tipo", nullable = false, length = 30)
    private String tipo;

    @Column(name = "primera_vez", nullable = false)
    @Builder.Default
    private Boolean primeraVez = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinica_personal_id")
    private EspacioFisico clinicaPersonal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id")
    private UsuarioReferencia registradoPor;

    @Column(name = "registrado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime registradoEn = OffsetDateTime.now();
}
