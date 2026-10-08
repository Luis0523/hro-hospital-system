package com.hro.system.archivo.controller;

import com.hro.system.archivo.dto.ConfiguracionArchivoDTO;
import com.hro.system.common.ApiResponse;
import com.hro.system.parametro.service.ParametroSistemaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/archivo/configuracion")
@RequiredArgsConstructor
@Tag(name = "Archivo - Configuración", description = "Parámetros configurables de la Estación de Archivo (umbral activo/pasivo)")
public class ArchivoConfiguracionController {

    private final ParametroSistemaService parametros;

    @GetMapping
    @Operation(summary = "Obtener configuración de Archivo",
            description = "Devuelve el número de expediente umbral que separa archivo activo (mayor) de pasivo (menor o igual).")
    public ResponseEntity<ApiResponse<ConfiguracionArchivoDTO>> obtener() {
        return ResponseEntity.ok(ApiResponse.ok(new ConfiguracionArchivoDTO(umbralActual()), "Configuración de archivo obtenida"));
    }

    @PutMapping
    @Operation(summary = "Actualizar configuración de Archivo",
            description = "Configura el número de expediente umbral para clasificar activo/pasivo.")
    public ResponseEntity<ApiResponse<ConfiguracionArchivoDTO>> actualizar(
            @RequestBody ConfiguracionArchivoDTO dto) {
        parametros.guardar(ParametroSistemaService.UMBRAL_ARCHIVO_ACTIVO, String.valueOf(dto.umbralActivo()));
        return ResponseEntity.ok(ApiResponse.ok(new ConfiguracionArchivoDTO(umbralActual()), "Configuración de archivo actualizada"));
    }

    private Long umbralActual() {
        String valor = parametros.obtener(ParametroSistemaService.UMBRAL_ARCHIVO_ACTIVO, null);
        try {
            return (valor != null && !valor.isBlank()) ? Long.valueOf(valor.trim()) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
