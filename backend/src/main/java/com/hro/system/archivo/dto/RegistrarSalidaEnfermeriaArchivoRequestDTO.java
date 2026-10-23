package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class RegistrarSalidaEnfermeriaArchivoRequestDTO {
    @NotBlank(message = "El número de expediente es obligatorio")
    private String numeroExpediente;

    private Long estacionId;
    private LocalDate fecha;

    /** normal, privado_libertad, personal o presentacion. */
    private String tipo;

    private Boolean primeraVez;

    /** Requerida cuando el tipo es personal. */
    private UUID clinicaPersonalId;
}
