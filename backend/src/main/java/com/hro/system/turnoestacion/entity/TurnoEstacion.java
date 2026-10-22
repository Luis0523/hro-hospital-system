package com.hro.system.turnoestacion.entity;

import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.cita.entity.Cita;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.medico.entity.Medico;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "turno_estacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TurnoEstacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especialidad_id", nullable = false)
    private Especialidad especialidad;

    @Column(name = "correlativo_especialidad", nullable = false)
    private Integer correlativoEspecialidad;

    @Column(name = "numero_general", nullable = false)
    private Integer numeroGeneral;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoTurnoEstacion estado = EstadoTurnoEstacion.registrado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediente_id")
    private Expediente expediente;

    @Column(name = "numero_expediente", length = 30)
    private String numeroExpediente;

    @Column(name = "paciente_nombre", length = 200)
    private String pacienteNombre;

    @Column(name = "tipo_registro", length = 30)
    private String tipoRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cita_id")
    private Cita cita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediente_ciclo_id")
    private ExpedienteCiclo expedienteCiclo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_fisico_id")
    private EspacioFisico espacioFisico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id")
    private Medico medico;

    @Column(name = "llamados", nullable = false)
    @Builder.Default
    private Integer llamados = 0;

    @Column(name = "ultimo_llamado_en")
    private OffsetDateTime ultimoLlamadoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id", nullable = false)
    private UsuarioReferencia registradoPor;

    @Column(name = "registrado_en", nullable = false)
    private OffsetDateTime registradoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recibido_por_id")
    private UsuarioReferencia recibidoPor;

    @Column(name = "recibido_en")
    private OffsetDateTime recibidoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignado_por_id")
    private UsuarioReferencia asignadoPor;

    @Column(name = "asignado_en")
    private OffsetDateTime asignadoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atendido_por_id")
    private UsuarioReferencia atendidoPor;

    @Column(name = "atendido_en")
    private OffsetDateTime atendidoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "no_asistio_por_id")
    private UsuarioReferencia noAsistioPor;

    @Column(name = "no_asistio_en")
    private OffsetDateTime noAsistioEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devuelto_por_id")
    private UsuarioReferencia devueltoPor;

    @Column(name = "devuelto_en")
    private OffsetDateTime devueltoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archivado_por_id")
    private UsuarioReferencia archivadoPor;

    @Column(name = "archivado_en")
    private OffsetDateTime archivadoEn;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eliminado_por_id")
    private UsuarioReferencia eliminadoPor;

    @Column(name = "eliminado_en")
    private OffsetDateTime eliminadoEn;

    @Column(name = "motivo_eliminacion", columnDefinition = "TEXT")
    private String motivoEliminacion;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 0;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}
