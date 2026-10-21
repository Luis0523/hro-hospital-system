package com.hro.system.turnoestacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibroTurnoEstacionResponseDTO {

    private Long estacionId;
    private String estacionNombre;
    private LocalDate fecha;
    private Map<String, Long> resumen;
    private List<LibroEspecialidadDTO> especialidades;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LibroEspecialidadDTO {
        private Long id;
        private String nombre;
        private String abreviatura;
        private Integer correlativoMax;
        private long registrados;
        private List<TurnoEstacionResponseDTO> turnos;
    }
}
