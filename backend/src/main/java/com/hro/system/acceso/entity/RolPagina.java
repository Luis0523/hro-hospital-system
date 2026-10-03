package com.hro.system.acceso.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Página/área del SIGHO permitida a un rol (configurable). El rol se identifica
 * por su nombre en Keycloak; aquí no se administran roles, solo sus páginas.
 */
@Entity
@Table(name = "rol_pagina", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"rol", "pagina"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolPagina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rol", nullable = false, length = 40)
    private String rol;

    @Column(name = "pagina", nullable = false, length = 40)
    private String pagina;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "creado_en", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime creadoEn = OffsetDateTime.now();

    @Column(name = "actualizado_en", nullable = false)
    @Builder.Default
    private OffsetDateTime actualizadoEn = OffsetDateTime.now();
}
