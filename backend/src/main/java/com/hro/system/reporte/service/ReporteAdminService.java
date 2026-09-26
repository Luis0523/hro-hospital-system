package com.hro.system.reporte.service;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.reporte.dto.DemandaEspecialidadDTO;
import com.hro.system.reporte.dto.ReporteCitasPorEstadoDTO;
import com.hro.system.reporte.dto.ReporteDemandaEspecialidadDTO;
import com.hro.system.reporte.dto.ReporteUtilizacionCuposDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reportes operativos administrativos. Todas las agregaciones se calculan en backend;
 * el frontend solo muestra los resultados.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteAdminService {

    private static final int DIAS_DEFECTO = 30;

    private final CitaRepository citaRepository;
    private final CupoDiarioRepository cupoDiarioRepository;

    @Transactional(readOnly = true)
    public ReporteCitasPorEstadoDTO citasPorEstado(LocalDate inicio, LocalDate fin) {
        Rango rango = normalizar(inicio, fin);

        Map<String, Long> porEstado = new LinkedHashMap<>();
        long total = 0;
        for (Object[] fila : citaRepository.contarPorEstadoEnRango(rango.inicio(), rango.fin())) {
            String estado = (String) fila[0];
            long cantidad = ((Number) fila[1]).longValue();
            porEstado.put(estado, cantidad);
            total += cantidad;
        }

        return ReporteCitasPorEstadoDTO.builder()
                .fechaInicio(rango.inicio())
                .fechaFin(rango.fin())
                .total(total)
                .porEstado(porEstado)
                .build();
    }

    @Transactional(readOnly = true)
    public ReporteDemandaEspecialidadDTO demandaPorEspecialidad(LocalDate inicio, LocalDate fin) {
        Rango rango = normalizar(inicio, fin);

        List<DemandaEspecialidadDTO> items = new ArrayList<>();
        for (Object[] fila : citaRepository.demandaPorEspecialidadEnRango(rango.inicio(), rango.fin())) {
            items.add(DemandaEspecialidadDTO.builder()
                    .especialidadId(((Number) fila[0]).longValue())
                    .especialidadNombre((String) fila[1])
                    .totalCitas(((Number) fila[2]).longValue())
                    .atendidas(((Number) fila[3]).longValue())
                    .inasistencias(((Number) fila[4]).longValue())
                    .build());
        }

        return ReporteDemandaEspecialidadDTO.builder()
                .fechaInicio(rango.inicio())
                .fechaFin(rango.fin())
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public ReporteUtilizacionCuposDTO utilizacionCupos(LocalDate inicio, LocalDate fin, Long subespecialidadId, Long especialidadId) {
        Rango rango = normalizar(inicio, fin);

        Specification<CupoDiario> filtro = (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            predicados.add(cb.between(root.get("fecha"), rango.inicio(), rango.fin()));
            if (subespecialidadId != null) {
                predicados.add(cb.equal(root.get("subespecialidadHorario").get("subespecialidad").get("id"), subespecialidadId));
            }
            if (especialidadId != null) {
                predicados.add(cb.equal(
                        root.get("subespecialidadHorario").get("subespecialidad").get("especialidad").get("id"),
                predicados.add(cb.equal(root.get("medicoSubespecialidad").get("subespecialidad").get("id"), subespecialidadId));
            }
            if (especialidadId != null) {
                predicados.add(cb.equal(
                        root.get("medicoSubespecialidad").get("subespecialidad").get("especialidad").get("id"),
                        especialidadId));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };

        int capacidadTotal = 0;
        int cuposOcupados = 0;
        for (CupoDiario cupo : cupoDiarioRepository.findAll(filtro)) {
            capacidadTotal += cupo.getCapacidadMaxima();
            cuposOcupados += cupo.getCuposOcupados();
        }

        double utilizacion = capacidadTotal > 0
                ? Math.round((cuposOcupados * 10000.0) / capacidadTotal) / 100.0
                : 0.0;

        return ReporteUtilizacionCuposDTO.builder()
                .fechaInicio(rango.inicio())
                .fechaFin(rango.fin())
                .subespecialidadId(subespecialidadId)
                .especialidadId(especialidadId)
                .capacidadTotal(capacidadTotal)
                .cuposOcupados(cuposOcupados)
                .cuposDisponibles(Math.max(0, capacidadTotal - cuposOcupados))
                .utilizacionPorcentaje(utilizacion)
                .build();
    }

    private Rango normalizar(LocalDate inicio, LocalDate fin) {
        LocalDate finResuelto = (fin != null) ? fin : LocalDate.now();
        LocalDate inicioResuelto = (inicio != null) ? inicio : finResuelto.minusDays(DIAS_DEFECTO);
        if (finResuelto.isBefore(inicioResuelto)) {
            throw new BusinessException("La fecha final no puede ser anterior a la fecha inicial.");
        }
        return new Rango(inicioResuelto, finResuelto);
    }

    private record Rango(LocalDate inicio, LocalDate fin) {
    }
}
