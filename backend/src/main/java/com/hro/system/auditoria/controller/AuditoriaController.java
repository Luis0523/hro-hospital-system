package com.hro.system.auditoria.controller;

import com.hro.system.auditoria.dto.AuditoriaResponseDTO;
import com.hro.system.auditoria.service.AuditoriaService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/auditoria")
@RequiredArgsConstructor
@Tag(name = "Auditoría", description = "Endpoints para consulta de bitácora y trazabilidad de operaciones")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    @GetMapping
    @PreAuthorize("hasRole('administrador')")
    @Operation(summary = "Consultar bitácora general",
            description = "Solo rol administrador. Filtros combinables por tabla, usuario, acción y rango de fechas, con paginación.")
    public ResponseEntity<ApiResponse<Page<AuditoriaResponseDTO>>> listarAuditoria(
            @Parameter(description = "Tabla afectada (ej. cita, medico)") @RequestParam(required = false) String tabla,
            @Parameter(description = "ID del usuario que realizó la operación") @RequestParam(required = false) Long usuarioId,
            @Parameter(description = "Acción (crear, actualizar, eliminar, activar, desactivar, reactivar)") @RequestParam(required = false) String accion,
            @Parameter(description = "Fecha inicial (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @Parameter(description = "Fecha final (ISO: YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @PageableDefault(size = 20, sort = "fecha", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AuditoriaResponseDTO> resultado = auditoriaService.listarAuditoria(tabla, usuarioId, accion, fechaInicio, fechaFin, pageable);
        return ResponseEntity.ok(ApiResponse.ok(resultado, "Bitácora de auditoría consultada correctamente"));
    }
}
