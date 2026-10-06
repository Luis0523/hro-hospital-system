package com.hro.system.libro.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarLibroCitasRequestDTO {

    @NotEmpty(message = "Debe enviar al menos una cita")
    @Valid
    @Builder.Default
    private List<LibroCitasExpedienteItemDTO> items = new ArrayList<>();
}
