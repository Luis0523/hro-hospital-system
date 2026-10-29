package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Registro manual de una salida cuando el API del hospital no reconoce el
 * expediente. NO consulta ni actualiza el hospital: solo guarda el registro
 * en el listado compartido de la estación y en el reporte.
 */
@Data
public class RegistrarSalidaArchivoManualRequestDTO {

    @NotBlank(message = "El número de expediente es obligatorio")
    @Size(max = 30, message = "El número de expediente no puede superar 30 caracteres")
    private String numeroExpediente;

    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(max = 200, message = "El nombre no puede superar 200 caracteres")
    private String pacienteNombre;

    /** Estación de donde proviene. Si no se indica, se toma del contexto (X-Estacion-Id). */
    private Long estacionId;

    /** Opcional: por defecto, hoy (zona Guatemala). */
    private LocalDate fecha;

    /** Etiqueta operativa elegida (opcional, una sola). */
    private Long etiquetaId;
}
