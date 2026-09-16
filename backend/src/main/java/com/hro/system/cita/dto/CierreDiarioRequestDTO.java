package com.hro.system.cita.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Solicitud para ejecutar el cierre operativo de jornada")
public class CierreDiarioRequestDTO {

    @NotNull(message = "La fecha de cierre es obligatoria")
    @Schema(description = "Fecha de la jornada a cerrar", example = "2026-09-11")
    private LocalDate fecha;

    @Schema(description = "ID opcional de la clínica (si se omite, cierra todas las clínicas de la fecha)", example = "1")
    private Long clinicaId;

    @Schema(description = "ID del usuario que realiza el cierre. Opcional: si se omite, se toma del usuario autenticado.", example = "2")
    private Long usuarioId;
}
