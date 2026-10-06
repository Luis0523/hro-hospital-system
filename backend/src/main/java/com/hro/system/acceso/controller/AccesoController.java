package com.hro.system.acceso.controller;

import com.hro.system.acceso.dto.AsignarPaginasRolRequestDTO;
import com.hro.system.acceso.dto.PaginaDTO;
import com.hro.system.acceso.dto.RolPaginasDTO;
import com.hro.system.acceso.service.AccesoService;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Configuración de páginas/áreas por rol. Los roles se administran en Keycloak;
 * aquí solo se define a qué páginas del SIGHO accede cada rol.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Acceso - Páginas por rol", description = "Configuración de páginas por rol (panel de administración)")
public class AccesoController {

    private final AccesoService accesoService;

    @GetMapping("/paginas")
    @Operation(summary = "Catálogo de páginas", description = "Páginas/áreas disponibles para asignar a un rol.")
    public ResponseEntity<ApiResponse<List<PaginaDTO>>> catalogo() {
        return ResponseEntity.ok(ApiResponse.ok(accesoService.catalogo(), "Catálogo de páginas obtenido"));
    }

    @GetMapping("/roles-paginas")
    @Operation(summary = "Listar páginas por rol", description = "Mapeo rol → páginas permitidas.")
    public ResponseEntity<ApiResponse<List<RolPaginasDTO>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(accesoService.listar(), "Páginas por rol obtenidas"));
    }

    @PutMapping("/roles-paginas/{rol}")
    @PreAuthorize("hasRole('administrador')")
    @Operation(summary = "Asignar páginas a un rol", description = "Reemplaza las páginas permitidas del rol. Requiere rol administrador.")
    public ResponseEntity<ApiResponse<RolPaginasDTO>> asignar(
            @PathVariable String rol,
            @Valid @RequestBody AsignarPaginasRolRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(accesoService.asignar(rol, dto.getPaginas()), "Páginas del rol actualizadas"));
    }
}
