package com.hro.system.usuario.controller;

import com.hro.system.common.ApiResponse;
import com.hro.system.usuario.entity.RolSistema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/roles")
@Tag(name = "Roles (Admin)", description = "Catálogo de roles operativos válidos del sistema")
public class RolController {

    @GetMapping
    @Operation(summary = "Listar roles disponibles", description = "Valores válidos de rol_principal definidos en backend.")
    public ResponseEntity<ApiResponse<List<String>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(RolSistema.valoresPermitidos(), "Roles obtenidos"));
    }
}
