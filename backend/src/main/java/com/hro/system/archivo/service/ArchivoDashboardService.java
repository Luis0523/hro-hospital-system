package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.EstadisticasArchivoDTO;
import com.hro.system.archivo.dto.EventoMovimientoDTO;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.entity.ExpedienteMovimiento;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteMovimientoRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.cita.entity.Cita;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.paciente.entity.Paciente;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Estadísticas y bitácora para el Dashboard de Archivo (frontend mock-first con
 * contrato propuesto en docs/instrucciones/dashboard-archivo.md).
 * <p>
 * El dashboard consume:
 * <ul>
 *   <li>{@code GET /archivo/estadisticas?desde=&hasta=&subespecialidadId=}</li>
 *   <li>{@code GET /archivo/movimientos?desde=&hasta=&estado=&page=&size=}</li>
 * </ul>
 * más el resumen diario existente ({@code GET /archivo/resumen}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArchivoDashboardService {

    private static final List<String> ORDEN = List.of(
            ArchivoService.PENDIENTE_LOCALIZAR,
            ArchivoService.EN_BUSQUEDA,
            ArchivoService.LOCALIZADO,
            ArchivoService.EN_TRANSITO_ENTREGA,
            ArchivoService.ENTREGADO,
            ArchivoService.EN_TRANSITO_RETORNO,
            ArchivoService.ARCHIVADO,
            ArchivoService.NO_LOCALIZADO);

    private final ExpedienteCicloRepository cicloRepository;
    private final ExpedienteMovimientoRepository movimientoRepository;
    private final ExpedienteRepository expedienteRepository;

    @Transactional(readOnly = true)
    public EstadisticasArchivoDTO estadisticas(LocalDate desdeParam, LocalDate hastaParam, Long subespecialidadId) {
        LocalDate hasta = (hastaParam != null) ? hastaParam : (desdeParam != null ? desdeParam : LocalDate.now());
        LocalDate desde = (desdeParam != null) ? desdeParam : hasta;
        if (desde.isAfter(hasta)) {
            LocalDate tmp = desde;
            desde = hasta;
            hasta = tmp;
        }

        List<ExpedienteCiclo> ciclos = cicloRepository.buscarDashboard(desde, hasta, subespecialidadId);

        Map<String, Long> porEstado = new LinkedHashMap<>();
        for (String estado : ORDEN) {
            porEstado.put(estado, 0L);
        }
        Map<Long, long[]> porUnidad = new LinkedHashMap<>();
        Map<Long, String> unidadNombre = new HashMap<>();
        for (ExpedienteCiclo ciclo : ciclos) {
            porEstado.merge(ciclo.getEstadoActual(), 1L, Long::sum);
            Subespecialidad sub = subespecialidadDe(ciclo);
            if (sub != null) {
                unidadNombre.putIfAbsent(sub.getId(), sub.getNombre());
                long[] contadores = porUnidad.computeIfAbsent(sub.getId(), k -> new long[2]);
                contadores[0]++;
                if (ArchivoService.NO_LOCALIZADO.equals(ciclo.getEstadoActual())) {
                    contadores[1]++;
                }
            }
        }

        List<EstadisticasArchivoDTO.EstadoTotal> porEstadoList = porEstado.entrySet().stream()
                .map(e -> new EstadisticasArchivoDTO.EstadoTotal(e.getKey(), e.getValue()))
                .toList();

        List<EstadisticasArchivoDTO.UnidadTotal> porUnidadList = porUnidad.entrySet().stream()
                .map(e -> new EstadisticasArchivoDTO.UnidadTotal(
                        e.getKey(), unidadNombre.get(e.getKey()), e.getValue()[0], e.getValue()[1]))
                .sorted((a, b) -> Long.compare(b.total(), a.total()))
                .toList();

        Set<UUID> cicloIds = ciclos.stream().map(ExpedienteCiclo::getId).collect(Collectors.toSet());
        List<ExpedienteMovimiento> movimientos = cicloIds.isEmpty()
                ? List.of()
                : movimientoRepository.buscarPorCiclos(cicloIds);

        // Serie diaria: transiciones, ciclos nuevos y no localizados por día.
        Map<LocalDate, long[]> serie = new TreeMap<>();
        for (LocalDate dia = desde; !dia.isAfter(hasta); dia = dia.plusDays(1)) {
            serie.put(dia, new long[3]);
        }
        for (ExpedienteCiclo ciclo : ciclos) {
            long[] contadores = serie.get(ciclo.getCreadoEn().toLocalDate());
            if (contadores != null) {
                contadores[1]++;
            }
        }
        for (ExpedienteMovimiento movimiento : movimientos) {
            long[] contadores = serie.get(movimiento.getFechaMovimiento().toLocalDate());
            if (contadores == null) {
                continue;
            }
            contadores[0]++;
            if (ArchivoService.NO_LOCALIZADO.equals(movimiento.getEstadoNuevo())) {
                contadores[2]++;
            }
        }
        List<EstadisticasArchivoDTO.SerieDiaria> serieList = serie.entrySet().stream()
                .map(e -> new EstadisticasArchivoDTO.SerieDiaria(
                        e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .toList();

        // Permanencia promedio por estado (diferencia entre un movimiento y el siguiente).
        Map<UUID, List<ExpedienteMovimiento>> porCiclo = new HashMap<>();
        for (ExpedienteMovimiento movimiento : movimientos) {
            porCiclo.computeIfAbsent(movimiento.getExpedienteCiclo().getId(), k -> new ArrayList<>())
                    .add(movimiento);
        }
        Map<String, long[]> permanencia = new LinkedHashMap<>();
        for (List<ExpedienteMovimiento> lista : porCiclo.values()) {
            for (int i = 0; i < lista.size() - 1; i++) {
                long minutos = Math.max(0, Duration.between(
                        lista.get(i).getFechaMovimiento(),
                        lista.get(i + 1).getFechaMovimiento()).toMinutes());
                long[] contadores = permanencia.computeIfAbsent(lista.get(i).getEstadoNuevo(), k -> new long[2]);
                contadores[0] += minutos;
                contadores[1]++;
            }
        }
        List<EstadisticasArchivoDTO.Permanencia> permanenciaList = permanencia.entrySet().stream()
                .map(e -> new EstadisticasArchivoDTO.Permanencia(
                        e.getKey(),
                        e.getValue()[1] == 0 ? 0 : Math.round((double) e.getValue()[0] / e.getValue()[1])))
                .toList();

        long noLocalizado = porEstado.getOrDefault(ArchivoService.NO_LOCALIZADO, 0L);
        long enTransito = porEstado.getOrDefault(ArchivoService.EN_TRANSITO_ENTREGA, 0L)
                + porEstado.getOrDefault(ArchivoService.EN_TRANSITO_RETORNO, 0L);
        long expedientesNuevos = expedienteRepository.countByCreadoEnBetween(
                desde.atStartOfDay().atOffset(ZoneOffset.UTC),
                hasta.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC));

        EstadisticasArchivoDTO.Totales totales = new EstadisticasArchivoDTO.Totales(
                ciclos.size(),
                expedientesNuevos,
                noLocalizado,
                porEstado.getOrDefault(ArchivoService.ARCHIVADO, 0L),
                porEstado.getOrDefault(ArchivoService.ENTREGADO, 0L),
                enTransito);

        return new EstadisticasArchivoDTO(
                new EstadisticasArchivoDTO.Rango(desde, hasta),
                totales,
                porEstadoList,
                serieList,
                porUnidadList,
                permanenciaList);
    }

    @Transactional(readOnly = true)
    public Page<EventoMovimientoDTO> movimientos(LocalDate desdeParam, LocalDate hastaParam,
                                                 String estado, int page, int size) {
        LocalDate hasta = (hastaParam != null) ? hastaParam : (desdeParam != null ? desdeParam : LocalDate.now());
        LocalDate desde = (desdeParam != null) ? desdeParam : hasta;

        OffsetDateTime desdeTs = desde.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime hastaTs = hasta.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        String estadoNormalizado = (estado != null && !estado.isBlank()) ? estado.trim() : null;

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 200));
        return movimientoRepository.buscarDashboard(desdeTs, hastaTs, estadoNormalizado, pageable)
                .map(this::mapEvento);
    }

    private EventoMovimientoDTO mapEvento(ExpedienteMovimiento movimiento) {
        Expediente expediente = movimiento.getExpedienteCiclo().getExpediente();
        Paciente paciente = expediente.getPaciente();
        return new EventoMovimientoDTO(
                movimiento.getId(),
                expediente.getId(),
                expediente.getNumeroExpediente(),
                paciente.getNombres() + " " + paciente.getApellidos(),
                movimiento.getEstadoAnterior(),
                movimiento.getEstadoNuevo(),
                movimiento.getUsuarioReferencia() != null ? movimiento.getUsuarioReferencia().getNombreMostrar() : null,
                movimiento.getObservacion(),
                movimiento.getFechaMovimiento());
    }

    private Subespecialidad subespecialidadDe(ExpedienteCiclo ciclo) {
        Cita cita = ciclo.getCita();
        if (cita == null || cita.getCupoDiario() == null
                || cita.getCupoDiario().getSubespecialidadHorario() == null) {
            return null;
        }
        return cita.getCupoDiario().getSubespecialidadHorario().getSubespecialidad();
    }
}
