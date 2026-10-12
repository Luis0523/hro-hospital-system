package com.hro.system.archivo.entity;

import com.hro.system.paciente.entity.Paciente;
import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Bitácora inmutable de bajas (depuración) de expedientes. Cada fila representa
 * un expediente marcado como "ya no existe en el sistema".
 * <p>
 * {@code expediente} es nullable a propósito: permite registrar una baja durante
 * la migración aunque todavía no exista la entidad local (Fase 2).
 */
@Entity
@Table(name = "expediente_depuracion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpedienteDepuracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediente_id")
    private Expediente expediente;

    @Column(name = "numero_expediente", nullable = false, length = 30)
    private String numeroExpediente;

    @Column(name = "paciente_nombre", length = 200)
    private String pacienteNombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_referencia_id", nullable = false)
    private UsuarioReferencia usuario;

    @Column(name = "depurado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime depuradoEn = OffsetDateTime.now();
}
