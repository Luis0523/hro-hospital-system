package com.hro.system.archivo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UbicacionArchivoResponseDTO {
    private Long id;
    private String pasillo;
    private String estante;
    private String balda;
    private String descripcion;
}
