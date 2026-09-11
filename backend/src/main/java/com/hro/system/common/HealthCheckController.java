package com.hro.system.common;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
@Tag(name = "Health Check", description = "Endpoints para monitoreo y estado del servicio")
public class HealthCheckController {

    @GetMapping
    @Operation(summary = "Verificar estado del servicio", description = "Retorna el estado actual del backend, version y hora del sistema.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> status = Map.of(
                "status", "UP",
                "service", "HRO Hospital System Backend",
                "version", "1.0.0",
                "phase", "Fase 1 - Fundacion"
        );
        return ResponseEntity.ok(ApiResponse.ok(status, "Servicio funcionando correctamente"));
    }
}
