package com.hro.system.estacion.entity;

import com.hro.system.usuario.entity.UsuarioReferencia;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Bitácora de rotación: registra qué usuario entró a qué estación y en qué momento.
 * Cualquier enfermera/o autorizado puede entrar a cualquier estación.
 */
@Entity
@Table(name = "estacion_acceso")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstacionAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estacion_id", nullable = false)
    private EstacionEnfermeria estacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_referencia_id", nullable = false)
    private UsuarioReferencia usuarioReferencia;

    @Column(name = "entrado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime entradoEn = OffsetDateTime.now();

    @Column(name = "salido_en")
    private OffsetDateTime salidoEn;
}
