package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class ActualizarSalidaEnfermeriaArchivoRequestDTO {
    @NotBlank(message = "El número de expediente es obligatorio")
    private String numeroExpediente;

    /** normal, privado_libertad, personal o presentacion. */
    private String tipo;

    private Boolean primeraVez;

    /** Requerida cuando el tipo es personal. */
    private UUID clinicaPersonalId;
}
