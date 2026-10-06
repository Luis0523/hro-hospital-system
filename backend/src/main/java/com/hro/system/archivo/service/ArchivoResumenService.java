package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.ResumenArchivoDTO;
import com.hro.system.archivo.dto.SalidaExpedienteDTO;
import com.hro.system.archivo.dto.SalidaExpedientesDTO;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.cita.entity.Cita;
import com.hro.system.paciente.entity.Paciente;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Indicadores diarios del departamento de Archivo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArchivoResumenService {

    private final ExpedienteCicloRepository expedienteCicloRepository;
    private final ExpedienteRepository expedienteRepository;
    private final ArchivoPdfService pdfService;

    @Transactional(readOnly = true)
    public ResumenArchivoDTO obtener(LocalDate fechaParam) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now();

        Map<String, Long> porEstado = new HashMap<>();
        long total = 0;
        for (Object[] fila : expedienteCicloRepository.contarPorEstadoYFecha(fecha)) {
            String estado = (String) fila[0];
            long cantidad = ((Number) fila[1]).longValue();
            porEstado.put(estado, cantidad);
            total += cantidad;
        }

        long enTransitoEntrega = porEstado.getOrDefault(ArchivoService.EN_TRANSITO_ENTREGA, 0L);
        long enTransitoRetorno = porEstado.getOrDefault(ArchivoService.EN_TRANSITO_RETORNO, 0L);

        long expedientesNuevos = expedienteRepository.countByCreadoEnBetween(
                fecha.atStartOfDay().atOffset(ZoneOffset.UTC),
                fecha.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC));

        return ResumenArchivoDTO.builder()
                .fecha(fecha)
                .totalCiclos(total)
                .pendienteLocalizar(porEstado.getOrDefault(ArchivoService.PENDIENTE_LOCALIZAR, 0L))
                .enBusqueda(porEstado.getOrDefault(ArchivoService.EN_BUSQUEDA, 0L))
                .localizado(porEstado.getOrDefault(ArchivoService.LOCALIZADO, 0L))
                .enTransitoEntrega(enTransitoEntrega)
                .enTransitoRetorno(enTransitoRetorno)
                .entregado(porEstado.getOrDefault(ArchivoService.ENTREGADO, 0L))
                .archivado(porEstado.getOrDefault(ArchivoService.ARCHIVADO, 0L))
                .noLocalizado(porEstado.getOrDefault(ArchivoService.NO_LOCALIZADO, 0L))
                .enTransito(enTransitoEntrega + enTransitoRetorno)
                .expedientesNuevos(expedientesNuevos)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(LocalDate fecha, String usuarioGenerador) {
        return pdfService.generarResumenPdf(obtener(fecha), usuarioGenerador);
    }

    /** Estados que cuentan como "el expediente sale del Archivo". */
    private static final List<String> ESTADOS_SALIDA =
            List.of(ArchivoService.LOCALIZADO, ArchivoService.EN_TRANSITO_ENTREGA);

    @Transactional(readOnly = true)
    public SalidaExpedientesDTO obtenerSalida(LocalDate fechaParam) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now();
        List<SalidaExpedienteDTO> items = expedienteCicloRepository
                .buscarSalidaPorFecha(fecha, ESTADOS_SALIDA).stream()
                .map(this::mapSalida)
                .toList();
        return SalidaExpedientesDTO.builder()
                .fecha(fecha)
                .total(items.size())
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] generarSalidaPdf(LocalDate fecha, String usuarioGenerador) {
        return pdfService.generarTraspasoPdf(obtenerSalida(fecha), usuarioGenerador);
    }

    private SalidaExpedienteDTO mapSalida(ExpedienteCiclo ciclo) {
        Expediente expediente = ciclo.getExpediente();
        Paciente paciente = expediente.getPaciente();
        Cita cita = ciclo.getCita();

        Long citaId = null;
        String hora = null;
        String area = null;
        if (cita != null) {
            citaId = cita.getId();
            hora = cita.getHoraEstimada() != null ? cita.getHoraEstimada().toString() : null;
            if (cita.getCupoDiario() != null
                    && cita.getCupoDiario().getSubespecialidadHorario() != null
                    && cita.getCupoDiario().getSubespecialidadHorario().getSubespecialidad() != null) {
                area = cita.getCupoDiario().getSubespecialidadHorario().getSubespecialidad().getNombre();
            }
        }

        return SalidaExpedienteDTO.builder()
                .expedienteId(expediente.getId())
                .numeroExpediente(expediente.getNumeroExpediente())
                .pacienteNombre(paciente.getNombres() + " " + paciente.getApellidos())
                .citaId(citaId)
                .subespecialidadNombre(area)
                .horaEstimada(hora)
                .estadoActual(ciclo.getEstadoActual())
                .build();
    }
}
