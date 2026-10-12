package com.hro.system.carnet.service;

import com.hro.system.carnet.dto.SalidaCarnetDTO;
import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.reporte.PlantillaReportePdf;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

/**
 * Reportes del circuito de expedientes (carnets) reutilizando la plantilla
 * institucional {@link PlantillaReportePdf} (A4 vertical):
 * <ul>
 *   <li><b>Salida</b> (Archivo): expedientes encontrados, ordenados por
 *       especialidad y número de expediente.</li>
 *   <li><b>Recepción</b> (Mesa COEX): expedientes recibidos en la estación.</li>
 *   <li><b>Devolución</b> (Mesa COEX): expedientes devueltos a Archivo.</li>
 * </ul>
 * Los reportes de COEX se emiten sin el bloque de firmas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteSalidaCarnetsService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    // "Encontrados": ya salieron o están en tránsito; se excluyen registrado y no_localizado.
    private static final Set<String> ESTADOS_ENCONTRADOS = Set.of(
            "encontrado", "despachado", "recibido_estacion", "devuelto_estacion", "recibido_archivo");

    // Recibidos en la estación (aún en uso por COEX/Enfermería).
    private static final Set<String> ESTADOS_RECIBIDOS = Set.of("recibido_estacion");

    // Devueltos a Archivo (en tránsito o ya recibidos por Archivo).
    private static final Set<String> ESTADOS_DEVUELTOS = Set.of("devuelto_estacion", "recibido_archivo");

    private final CarnetRepository carnetRepository;
    private final PlantillaReportePdf plantilla;

    // ------------------------------------------------------------------
    // Salida (Archivo)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SalidaCarnetDTO.Reporte listar(LocalDate fechaParam) {
        return listarPorEstados(fechaParam, ESTADOS_ENCONTRADOS, Carnet::getRegistradoEn);
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(LocalDate fechaParam, String usuarioGenerador) {
        SalidaCarnetDTO.Reporte salida = listar(fechaParam);
        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "CONTROL DE SALIDA DE EXPEDIENTES",
                "Archivo / Registro Médico -> Consulta Externa (COEX)",
                "SAL-" + identificarFecha(salida.fecha()),
                salida.fecha(),
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Archivo / Registro Médico",
                "Consulta Externa (COEX)",
                columnasExpedientes(),
                filasExpedientes(salida.expedientes()),
                salida.total(),
                "Entrega - Archivo",
                "Recibe - COEX / Enfermería",
                "");
        return generar(reporte);
    }

    // ------------------------------------------------------------------
    // Recepción y devolución (Mesa COEX)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SalidaCarnetDTO.Reporte listarRecepcion(LocalDate fechaParam) {
        return listarPorEstados(fechaParam, ESTADOS_RECIBIDOS, Carnet::getRecibidoEn);
    }

    @Transactional(readOnly = true)
    public SalidaCarnetDTO.Reporte listarDevolucion(LocalDate fechaParam) {
        return listarPorEstados(fechaParam, ESTADOS_DEVUELTOS, Carnet::getDevueltoEn);
    }

    @Transactional(readOnly = true)
    public byte[] generarRecepcionPdf(LocalDate fechaParam, String usuarioGenerador) {
        SalidaCarnetDTO.Reporte recepcion = listarRecepcion(fechaParam);
        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "CONTROL DE RECEPCIÓN DE EXPEDIENTES",
                "Consulta Externa (COEX) -> Estación de Enfermería",
                "REC-" + identificarFecha(recepcion.fecha()),
                recepcion.fecha(),
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Consulta Externa (COEX)",
                "Estación de Enfermería",
                columnasExpedientes(),
                filasExpedientes(recepcion.expedientes()),
                recepcion.total(),
                "",
                "",
                "",
                false);
        return generar(reporte);
    }

    @Transactional(readOnly = true)
    public byte[] generarDevolucionPdf(LocalDate fechaParam, String usuarioGenerador) {
        SalidaCarnetDTO.Reporte devolucion = listarDevolucion(fechaParam);
        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "CONTROL DE DEVOLUCIÓN DE EXPEDIENTES",
                "Estación de Enfermería -> Archivo / Registro Médico",
                "DEV-" + identificarFecha(devolucion.fecha()),
                devolucion.fecha(),
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Estación de Enfermería",
                "Archivo / Registro Médico",
                columnasExpedientes(),
                filasExpedientes(devolucion.expedientes()),
                devolucion.total(),
                "",
                "",
                "",
                false);
        return generar(reporte);
    }

    // ------------------------------------------------------------------
    // Apoyo
    // ------------------------------------------------------------------

    private SalidaCarnetDTO.Reporte listarPorEstados(LocalDate fechaParam, Set<String> estados,
                                                     Function<Carnet, OffsetDateTime> horaDe) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now(ZONA_HORARIA);
        List<SalidaCarnetDTO> items = carnetRepository.listarPorFecha(fecha).stream()
                .filter(carnet -> estados.contains(carnet.getEstado()))
                .sorted(Comparator
                        .comparing((Carnet c) -> c.getEspecialidad().getNombre())
                        .thenComparing(Carnet::getNumeroExpediente))
                .map(carnet -> new SalidaCarnetDTO(
                        carnet.getNumeroExpediente(),
                        carnet.getEspecialidad().getNombre(),
                        carnet.getPacienteNombre(),
                        formatearHora(horaDe.apply(carnet))))
                .toList();
        return new SalidaCarnetDTO.Reporte(fecha, items.size(), items);
    }

    private static List<PlantillaReportePdf.Columna> columnasExpedientes() {
        return List.of(
                new PlantillaReportePdf.Columna("#", 0.6f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Expediente", 1.3f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Especialidad", 1.7f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Paciente", 2.6f, PlantillaReportePdf.Alineacion.IZQUIERDA));
    }

    private static List<List<String>> filasExpedientes(List<SalidaCarnetDTO> items) {
        List<List<String>> filas = new java.util.ArrayList<>();
        int indice = 1;
        for (SalidaCarnetDTO item : items) {
            filas.add(List.of(
                    String.valueOf(indice++),
                    nvl(item.numeroExpediente()),
                    nvl(item.especialidadNombre()),
                    nvl(item.pacienteNombre())));
        }
        return filas;
    }

    private byte[] generar(PlantillaReportePdf.Reporte reporte) {
        try {
            return plantilla.generar(reporte);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo generar el reporte: " + e.getMessage(), e);
        }
    }

    private static String identificarFecha(LocalDate fecha) {
        return fecha.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    }

    private static String formatearHora(OffsetDateTime instante) {
        if (instante == null) {
            return "";
        }
        return instante.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private static String nvl(String valor) {
        return valor == null ? "" : valor;
    }
}
