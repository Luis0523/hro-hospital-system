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
public class PermisoSubespecialidadResponseDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private Long subespecialidadId;
    private String subespecialidadNombre;
    private Long especialidadId;
    private String especialidadNombre;
    private String tipoPermiso;
    private Boolean activo;
    private OffsetDateTime creadoEn;
}
