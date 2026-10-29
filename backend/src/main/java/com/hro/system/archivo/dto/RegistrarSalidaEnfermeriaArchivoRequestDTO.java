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

    /** normal, privado_libertad, personal, presentacion o clinica_mujer. */
    private String tipo;

    private Boolean primeraVez;

    /**
     * Nombre capturado manualmente cuando el expediente físico no coincide con
     * el paciente devuelto por el HRO. Si viene, se usa tal cual y no se
     * consulta el expediente en la API del hospital.
     */
    private String pacienteNombre;

    /** Requerida cuando el tipo es personal. */
    private UUID clinicaPersonalId;
}
