package com.hro.system.estacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicaOrdenDTO {
    private UUID espacioFisicoId;
    private String numero;
    private String nombre;
    private Short nivel;
    private Integer orden;
}
