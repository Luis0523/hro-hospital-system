package com.hro.system.usuario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponseDTO {
    private Long id;
    private String idExterno;
    private String nombreMostrar;
    private String rolPrincipal;
    private Boolean activo;
    private OffsetDateTime ultimoAcceso;
    private OffsetDateTime creadoEn;
}
