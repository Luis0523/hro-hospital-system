package com.hro.system.auditoria.controller;

import com.hro.system.auditoria.entity.AuditoriaGeneral;
import com.hro.system.auditoria.service.AuditoriaService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auditoria")
@RequiredArgsConstructor
@Tag(name = "Auditoría", description = "Endpoints para consulta de bitácora y trazabilidad de operaciones")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    @GetMapping
    @Operation(summary = "Consultar bitácora general", description = "Permite al administrador consultar registros de auditoría filtrados por tabla o usuario con paginación.")
    public ResponseEntity<ApiResponse<Page<AuditoriaGeneral>>> listarAuditoria(
            @RequestParam(required = false) String tabla,
            @RequestParam(required = false) Long usuarioId,
            @PageableDefault(size = 20, sort = "fecha", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AuditoriaGeneral> resultado = auditoriaService.listarAuditoria(tabla, usuarioId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(resultado, "Bitácora de auditoría consultada correctamente"));
    }
}
