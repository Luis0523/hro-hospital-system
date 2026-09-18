package com.hro.system.espacio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EspacioFisicoResponseDTO {
    private Long id;
    private String numero;
    private Short nivel;
    private Integer capacidadCamillas;
    private String coordenadasPlano;
    private String nombre;
    private String ubicacion;
    private Boolean activo;
    private OffsetDateTime creadoEn;
}
