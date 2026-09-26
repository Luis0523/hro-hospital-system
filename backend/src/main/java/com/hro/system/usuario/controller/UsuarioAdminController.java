package com.hro.system.usuario.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.common.EstadoFiltro;
import com.hro.system.usuario.dto.AsignarRolRequestDTO;
import com.hro.system.usuario.dto.PermisoSubespecialidadResponseDTO;
import com.hro.system.usuario.dto.UsuarioResponseDTO;
import com.hro.system.usuario.service.PermisoSubespecialidadService;
import com.hro.system.usuario.service.UsuarioAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Administración de usuarios internos. El alta proviene del proveedor externo de
 * identidad (JIT); no se administran contraseñas ni credenciales.
 */
@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios (Admin)", description = "Consulta, activación/desactivación y asignación de rol de usuarios internos")
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioAdminService;
    private final PermisoSubespecialidadService permisoSubespecialidadService;

    @GetMapping
    @Operation(summary = "Listar usuarios",
            description = "Filtros opcionales: estado (activos por defecto; inactivos; todos) y rol.")
    public ResponseEntity<ApiResponse<List<UsuarioResponseDTO>>> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String rol) {
        List<UsuarioResponseDTO> lista = usuarioAdminService.listar(EstadoFiltro.from(estado).aActivo(), rol);
        return ResponseEntity.ok(ApiResponse.ok(lista, "Usuarios obtenidos"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuario por ID")
    public ResponseEntity<ApiResponse<UsuarioResponseDTO>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioAdminService.buscarPorId(id), "Usuario localizado"));
    }

    @PatchMapping("/{id}/activar")
    @Operation(summary = "Activar usuario", description = "Vuelve a activar un usuario desactivado (idempotente).")
    public ResponseEntity<ApiResponse<UsuarioResponseDTO>> activar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioAdminService.activar(id), "Usuario activado"));
    }

    @PatchMapping("/{id}/desactivar")
    @Operation(summary = "Desactivar usuario", description = "Desactiva un usuario sin eliminarlo (idempotente).")
    public ResponseEntity<ApiResponse<UsuarioResponseDTO>> desactivar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioAdminService.desactivar(id), "Usuario desactivado"));
    }

    @PutMapping("/{id}/rol")
    @Operation(summary = "Asignar rol", description = "Asigna un rol operativo válido al usuario.")
    public ResponseEntity<ApiResponse<UsuarioResponseDTO>> asignarRol(
            @PathVariable Long id,
            @Valid @RequestBody AsignarRolRequestDTO dto) {
        return ResponseEntity.ok(ApiResponse.ok(
                usuarioAdminService.asignarRol(id, dto.getRolPrincipal()), "Rol asignado"));
    }

    @GetMapping("/{id}/permisos")
    @Operation(summary = "Listar permisos de un usuario",
            description = "Filtra por estado: activos (por defecto), inactivos o todos.")
    public ResponseEntity<ApiResponse<List<PermisoSubespecialidadResponseDTO>>> listarPermisos(
            @PathVariable Long id,
            @RequestParam(required = false) String estado) {
        return ResponseEntity.ok(ApiResponse.ok(
                permisoSubespecialidadService.listarPorUsuario(id, EstadoFiltro.from(estado).aActivo()),
                "Permisos del usuario"));
    }
}
