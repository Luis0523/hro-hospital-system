package com.hro.system.archivo.entity;

import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Registro diario manual del Cuaderno Rojo del Departamento de Archivo.
 * Existe a lo sumo un registro por fecha; volver a guardar la misma fecha
 * actualiza los valores en lugar de crear un duplicado.
 */
@Entity
@Table(name = "cuaderno_rojo_registro",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_cuaderno_rojo_fecha", columnNames = "fecha"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroCuadernoRojo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "egresos_hospitalarios", nullable = false)
    private Integer egresosHospitalarios;

    @Column(name = "sobres_emergencia", nullable = false)
    private Integer sobresEmergencia;

    @Column(name = "sobres_sellados", nullable = false)
    private Integer sobresSellados;

    @Column(name = "tia", nullable = false)
    private Integer tia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id")
    private UsuarioReferencia registradoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actualizado_por_id")
    private UsuarioReferencia actualizadoPor;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private OffsetDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private OffsetDateTime actualizadoEn;
}
