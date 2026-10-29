package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

/** Registro de una salida de archivo consultada al API del hospital. */
@Data
public class RegistrarSalidaArchivoHospitalRequestDTO {

    @NotBlank(message = "El número de expediente es obligatorio")
    private String numeroExpediente;

    /** Estación de donde proviene. Si no se indica, se toma del contexto (X-Estacion-Id). */
    private Long estacionId;

    /** Opcional: por defecto, hoy (zona Guatemala). */
    private LocalDate fecha;

    /** Etiqueta configurada para la estación (opcional, una sola). */
    private Long etiquetaId;

    /** Compatibilidad: marca la salida como Clínica de la Mujer si el cliente aún no envía etiquetaId. */
    private Boolean esClinicaMujer;
}
