package com.hro.system.auditoria.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

/**
 * Representación de un registro de auditoría para exponer por API.
 * Evita serializar directamente la entidad JPA (y sus relaciones lazy).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaResponseDTO {
    private Long id;
    private String tablaAfectada;
    private String entidadId;
    private String accion;
    private Long usuarioId;
    private String usuarioNombre;
    private String valoresAnteriores;
    private String valoresNuevos;
    private OffsetDateTime fecha;
}
