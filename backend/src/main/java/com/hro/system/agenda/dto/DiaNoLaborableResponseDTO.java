package com.hro.system.agenda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiaNoLaborableResponseDTO {
    private Long id;
    private LocalDate fecha;
    private String motivo;
    private Long creadoPorId;
    private String creadoPorNombre;
    private OffsetDateTime creadoEn;
}
