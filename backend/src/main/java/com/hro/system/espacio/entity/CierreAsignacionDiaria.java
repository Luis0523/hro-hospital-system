package com.hro.system.espacio.entity;

import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Cierre de la asignación diaria: una vez confirmada por el jefe de enfermería,
 * la asignación de esa fecha queda bloqueada para edición libre.
 */
@Entity
@Table(name = "cierre_asignacion_diaria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CierreAsignacionDiaria {

    @Id
    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "estado", nullable = false, length = 10)
    @Builder.Default
    private String estado = "abierta"; // abierta | cerrada

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmado_por")
    private UsuarioReferencia confirmadoPor;

    @Column(name = "confirmado_en")
    private OffsetDateTime confirmadoEn;
}
