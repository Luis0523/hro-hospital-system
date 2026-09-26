package com.hro.system.archivo.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrearActaRecepcionRequestDTO {

    /** Fecha de la jornada. Si se omite, se usa hoy. */
    private LocalDate fecha;

    private Long subespecialidadId;

    /** Quién entrega los expedientes. Si se omite, se usa el usuario autenticado. */
    private Long usuarioEntregaId;

    /** Quién recibe los expedientes (opcional). */
    private Long usuarioRecibeId;

    @Size(max = 1000, message = "Las observaciones no pueden exceder 1000 caracteres")
    private String observaciones;

    @NotEmpty(message = "Debe incluir al menos un expediente en el acta")
    private List<UUID> expedienteIds;
}
