package com.hro.system.usuario.entity;

import com.hro.system.clinica.entity.Subespecialidad;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Permiso de un usuario sobre una subespecialidad (no sobre la sala física, que cambia a diario).
 */
@Entity
@Table(name = "permiso_subespecialidad", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"usuario_referencia_id", "subespecialidad_id", "tipo_permiso"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermisoSubespecialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_referencia_id", nullable = false)
    private UsuarioReferencia usuarioReferencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subespecialidad_id", nullable = false)
    private Subespecialidad subespecialidad;

    @Column(name = "tipo_permiso", nullable = false, length = 40)
    private String tipoPermiso;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();
}
