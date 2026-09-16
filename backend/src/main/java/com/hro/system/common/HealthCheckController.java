package com.hro.system.common;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.info.BuildProperties;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/health")
@Tag(name = "Health Check", description = "Endpoints para monitoreo y estado del servicio")
public class HealthCheckController {

    private final Environment environment;
    private final Optional<BuildProperties> buildProperties;

    public HealthCheckController(Environment environment, Optional<BuildProperties> buildProperties) {
        this.environment = environment;
        this.buildProperties = buildProperties;
    }

    @GetMapping
    @Operation(summary = "Verificar estado del servicio", description = "Retorna el estado actual del backend, version, perfil y hora del sistema.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        String version = buildProperties.map(BuildProperties::getVersion).orElse("desconocida");
        String perfil = String.join(",", environment.getActiveProfiles());
        if (perfil.isBlank()) {
            perfil = "default";
        }

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("service", "HRO Hospital System Backend");
        status.put("version", version);
        status.put("profile", perfil);

        return ResponseEntity.ok(ApiResponse.ok(status, "Servicio funcionando correctamente"));
    }
}
