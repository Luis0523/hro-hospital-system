package com.hro.system.estacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstacionResponseDTO {
    private Long id;
    private String codigo;
    private String nombre;
    private String ubicacion;
    private Boolean activo;
    private OffsetDateTime creadoEn;
    private List<SubespecialidadAsignadaDTO> subespecialidades;
}
