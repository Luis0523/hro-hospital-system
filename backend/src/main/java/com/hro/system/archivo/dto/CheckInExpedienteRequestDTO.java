package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cuerpo opcional del check-in de un expediente físico.
 * <p>
 * {@code citaId} es opcional: si se omite, se resuelve la cita activa del día del
 * paciente dueño del expediente. {@code observacion} es libre.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInExpedienteRequestDTO {

    private Long citaId;
    private String observacion;
}
