package com.hro.system.dashboard.service;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.entity.DiaNoLaborable;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.dashboard.dto.AlertaAdminDTO;
import com.hro.system.dashboard.dto.ResumenAdminDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Indicadores agregados del panel administrativo. Todo el cálculo ocurre en backend
 * para que el frontend no replique reglas de negocio.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardAdminService {

    private static final int DIAS_ALERTA_PROXIMOS = 7;

    private final CitaRepository citaRepository;
    private final CupoDiarioRepository cupoDiarioRepository;
    private final DiaNoLaborableRepository diaNoLaborableRepository;

    @Transactional(readOnly = true)
    public ResumenAdminDTO obtenerResumen(LocalDate fechaParam) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now();

        Map<String, Long> porEstado = new HashMap<>();
        long totalCitas = 0;
        for (Object[] fila : citaRepository.contarPorEstadoYFecha(fecha)) {
            String estado = (String) fila[0];
            long cantidad = ((Number) fila[1]).longValue();
            porEstado.put(estado, cantidad);
            totalCitas += cantidad;
        }

        List<CupoDiario> cupos = cupoDiarioRepository.findByFecha(fecha);
        int capacidadTotal = 0;
        int cuposOcupados = 0;
        int cuposAgotados = 0;
        for (CupoDiario cupo : cupos) {
            capacidadTotal += cupo.getCapacidadMaxima();
            cuposOcupados += cupo.getCuposOcupados();
            if (cupo.getCapacidadMaxima() > 0 && cupo.getCuposOcupados() >= cupo.getCapacidadMaxima()) {
                cuposAgotados++;
            }
        }
        int cuposDisponibles = Math.max(0, capacidadTotal - cuposOcupados);

        long atendidas = porEstado.getOrDefault("atendida", 0L);
        long inasistencias = porEstado.getOrDefault("no_asistio", 0L);

        List<AlertaAdminDTO> alertas = construirAlertas(fecha, cuposAgotados);

        double tasaInasistencia = (atendidas + inasistencias) > 0
                ? Math.round((inasistencias * 10000.0) / (atendidas + inasistencias)) / 100.0
                : 0.0;

        return ResumenAdminDTO.builder()
                .fecha(fecha)
                .totalCitas(totalCitas)
                .citasPendientes(porEstado.getOrDefault("pendiente", 0L))
                .citasConfirmadas(porEstado.getOrDefault("confirmada", 0L))
                .citasAtendidas(atendidas)
                .citasCanceladas(porEstado.getOrDefault("cancelada", 0L))
                .citasReprogramadas(porEstado.getOrDefault("reprogramada", 0L))
                .inasistencias(inasistencias)
                .capacidadTotal(capacidadTotal)
                .cuposOcupados(cuposOcupados)
                .cuposDisponibles(cuposDisponibles)
                .tasaInasistencia(tasaInasistencia)
                .alertas(alertas)
                .build();
    }

    private List<AlertaAdminDTO> construirAlertas(LocalDate fecha, int cuposAgotados) {
        List<AlertaAdminDTO> alertas = new ArrayList<>();

        long citasEnDiasNoLaborables = citaRepository.contarCitasActivasEnDiasNoLaborables();
        if (citasEnDiasNoLaborables > 0) {
            alertas.add(AlertaAdminDTO.builder()
                    .codigo("CITAS_EN_DIA_NO_LABORABLE")
                    .severidad("CRITICA")
                    .mensaje(citasEnDiasNoLaborables + " cita(s) activa(s) caen en fechas marcadas como no laborables.")
                    .build());
        }

        if (cuposAgotados > 0) {
            alertas.add(AlertaAdminDTO.builder()
                    .codigo("CUPOS_AGOTADOS")
                    .severidad("ADVERTENCIA")
                    .mensaje(cuposAgotados + " cupo(s) del día alcanzaron su capacidad máxima.")
                    .build());
        }

        List<DiaNoLaborable> proximos = diaNoLaborableRepository.findByRangoFechas(fecha, fecha.plusDays(DIAS_ALERTA_PROXIMOS));
        if (!proximos.isEmpty()) {
            String fechas = proximos.stream()
                    .map(d -> d.getFecha().toString())
                    .collect(Collectors.joining(", "));
            alertas.add(AlertaAdminDTO.builder()
                    .codigo("DIAS_NO_LABORABLES_PROXIMOS")
                    .severidad("INFO")
                    .mensaje(proximos.size() + " día(s) no laborable(s) en los próximos " + DIAS_ALERTA_PROXIMOS + " días: " + fechas + ".")
                    .build());
        }

        return alertas;
    }
}
