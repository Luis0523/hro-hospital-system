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

    /** Marca la salida como perteneciente a la Clínica de la Mujer. */
    private Boolean esClinicaMujer;
}
