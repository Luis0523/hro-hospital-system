package com.hro.system.medico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrearMedicoRequestDTO {

    @NotBlank(message = "El nombre del médico es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    private String nombres;

    @NotBlank(message = "El número de colegiado es obligatorio")
    @Size(max = 50, message = "El número de colegiado no puede exceder 50 caracteres")
    private String numeroColegiado;

    private Long usuarioReferenciaId;
}
