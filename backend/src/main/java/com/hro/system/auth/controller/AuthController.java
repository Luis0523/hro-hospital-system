package com.hro.system.auth.controller;

import com.hro.system.auth.ProveedorIdentidad;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoints de apoyo para la autenticación simulada (modo mock).
 * Permiten al frontend verificar qué identidad está resolviendo el backend
 * a partir de las cabeceras X-Usuario-Id / X-Usuario-Rol / X-Usuario-Nombre.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación (Mock)", description = "Verificación de la identidad simulada mientras el servicio externo del hospital no está disponible")
public class AuthController {

    private final ProveedorIdentidad proveedorIdentidad;

    @GetMapping("/perfil")
    @Operation(summary = "Obtener el perfil simulado actual",
            description = "Devuelve la identidad resuelta desde las cabeceras de simulación o el usuario por defecto.")
    public ResponseEntity<ApiResponse<IdentidadUsuario>> perfil() {
        return UsuarioContexto.actual()
                .map(identidad -> ResponseEntity.ok(ApiResponse.ok(identidad, "Identidad simulada resuelta correctamente")))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("No se pudo resolver ninguna identidad")));
    }

    @GetMapping("/modo")
    @Operation(summary = "Consultar el modo de autenticación activo", description = "Retorna 'mock' o 'external'.")
    public ResponseEntity<ApiResponse<Map<String, String>>> modo() {
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("modo", proveedorIdentidad.modo()),
                "Modo de autenticación consultado"));
    }
}
