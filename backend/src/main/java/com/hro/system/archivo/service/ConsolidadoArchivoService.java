package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.ConsolidadoDiarioDTO;
import com.hro.system.archivo.dto.ConsolidadoMensualDTO;
import com.hro.system.archivo.repository.ArchivoConsolidadoRepository;
import com.hro.system.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Consolidado de Archivo (diario y mensual). Toda la agregación se delega a la
 * BD (vistas y funciones de la migración V23), de modo que la aplicación solo
 * orquesta la respuesta y nunca ejecuta GROUP BY sobre tablas grandes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsolidadoArchivoService {

    private static final ZoneId ZONA_HOSPITAL = ZoneId.of("America/Guatemala");

    private final ArchivoConsolidadoRepository consolidadoRepository;

    @Transactional(readOnly = true)
    public ConsolidadoDiarioDTO diario(LocalDate fechaParam) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now(ZONA_HOSPITAL);

        List<ConsolidadoDiarioDTO.EspecialidadTotal> porEspecialidad = consolidadoRepository.consolidadoDiario(fecha)
                .stream()
                .map(fila -> new ConsolidadoDiarioDTO.EspecialidadTotal(
                        asLong(fila[0]), asString(fila[1]), asLong(fila[2])))
                .toList();

        long total = porEspecialidad.stream().mapToLong(ConsolidadoDiarioDTO.EspecialidadTotal::total).sum();
        long depurados = depuradosDelDia(fecha);

        return new ConsolidadoDiarioDTO(fecha, total, depurados, porEspecialidad);
    }

    @Transactional(readOnly = true)
    public ConsolidadoMensualDTO mensual(Integer anio, Integer mes, LocalDate desdeParam, LocalDate hastaParam) {
        LocalDate desde;
        LocalDate hasta;
        if (desdeParam != null && hastaParam != null) {
            desde = desdeParam;
            hasta = hastaParam;
        } else if (anio != null && mes != null) {
            if (mes < 1 || mes > 12) {
                throw new BusinessException("El mes debe estar entre 1 y 12.");
            }
            desde = LocalDate.of(anio, mes, 1);
            hasta = desde.withDayOfMonth(desde.lengthOfMonth());
        } else {
            desde = LocalDate.now(ZONA_HOSPITAL).withDayOfMonth(1);
            hasta = desde.withDayOfMonth(desde.lengthOfMonth());
        }
        if (desde.isAfter(hasta)) {
            LocalDate tmp = desde;
            desde = hasta;
            hasta = tmp;
        }

        // Tabla 1 (informe por día): días con carnets y/o depuraciones.
        List<ConsolidadoMensualDTO.InformeDia> informe = new ArrayList<>();
        long totalCarnets = 0;
        long totalDepurados = 0;
        for (Object[] fila : consolidadoRepository.resumenRango(desde, hasta)) {
            long hdc = asLong(fila[1]);
            long hd = asLong(fila[2]);
            informe.add(new ConsolidadoMensualDTO.InformeDia(asLocalDate(fila[0]), hdc, hd));
            totalCarnets += hdc;
            totalDepurados += hd;
        }

        // Tabla 2 (detalle por especialidad, por día) y acumulado por especialidad.
        Map<LocalDate, List<ConsolidadoDiarioDTO.EspecialidadTotal>> detallePorDia = new LinkedHashMap<>();
        Map<Long, long[]> acumulado = new LinkedHashMap<>();
        Map<Long, String> nombreEspecialidad = new LinkedHashMap<>();
        for (Object[] fila : consolidadoRepository.consolidadoMensual(desde, hasta)) {
            LocalDate dia = asLocalDate(fila[0]);
            long espId = asLong(fila[1]);
            String espNombre = asString(fila[2]);
            long total = asLong(fila[3]);

            detallePorDia.computeIfAbsent(dia, k -> new ArrayList<>())
                    .add(new ConsolidadoDiarioDTO.EspecialidadTotal(espId, espNombre, total));
            nombreEspecialidad.putIfAbsent(espId, espNombre);
            acumulado.computeIfAbsent(espId, k -> new long[1])[0] += total;
        }

        List<ConsolidadoMensualDTO.DetalleDia> detalle = detallePorDia.entrySet().stream()
                .map(e -> new ConsolidadoMensualDTO.DetalleDia(
                        e.getKey(),
                        e.getValue().stream().mapToLong(ConsolidadoDiarioDTO.EspecialidadTotal::total).sum(),
                        e.getValue()))
                .toList();

        List<ConsolidadoDiarioDTO.EspecialidadTotal> porEspecialidad = acumulado.entrySet().stream()
                .map(e -> new ConsolidadoDiarioDTO.EspecialidadTotal(
                        e.getKey(), nombreEspecialidad.get(e.getKey()), e.getValue()[0]))
                .sorted((a, b) -> Long.compare(b.total(), a.total()))
                .toList();

        return new ConsolidadoMensualDTO(
                new ConsolidadoMensualDTO.Rango(desde, hasta),
                informe,
                detalle,
                new ConsolidadoMensualDTO.Totales(totalCarnets, totalDepurados, porEspecialidad));
    }

    private long depuradosDelDia(LocalDate fecha) {
        List<Object[]> filas = consolidadoRepository.resumenDiario(fecha);
        if (filas.isEmpty()) {
            return 0L;
        }
        return asLong(filas.get(0)[1]);
    }

    // Los valores nativos llegan como tipos SQL; se normalizan sin lanzar.
    private static long asLong(Object valor) {
        return (valor instanceof Number numero) ? numero.longValue() : 0L;
    }

    private static String asString(Object valor) {
        return (valor != null) ? valor.toString() : null;
    }

    private static LocalDate asLocalDate(Object valor) {
        if (valor instanceof LocalDate localDate) {
            return localDate;
        }
        if (valor instanceof java.sql.Date fecha) {
            return fecha.toLocalDate();
        }
        if (valor instanceof java.time.OffsetDateTime offset) {
            return offset.toLocalDate();
        }
        return LocalDate.parse(valor.toString());
    }
}
