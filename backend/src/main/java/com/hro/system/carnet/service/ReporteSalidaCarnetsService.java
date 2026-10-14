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
import java.util.UUID;
import java.util.function.Function;

/**
 * Reportes del circuito de expedientes (carnets) reutilizando la plantilla
 * institucional {@link PlantillaReportePdf} (A4 vertical):
 * <ul>
 *   <li><b>Salida de archivo</b> (Archivo): expedientes con salida de archivo registrada,
 *       ordenados por especialidad y número de expediente.</li>
 *   <li><b>Salida de enfermería</b> (Mesa COEX): expedientes que salen de enfermería
 *       de regreso a archivo.</li>
 * </ul>
 * El reporte de enfermería se emite sin el bloque de firmas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteSalidaCarnetsService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    // Expedientes con salida de archivo registrada (salieron del archivo).
    private static final Set<String> ESTADOS_SALIDA_ARCHIVO = Set.of("salida_archivo");

    // Expedientes con salida de enfermería registrada (regresan a archivo).
    private static final Set<String> ESTADOS_SALIDA_ENFERMERIA = Set.of("salida_enfermeria");

    private final CarnetRepository carnetRepository;
    private final PlantillaReportePdf plantilla;

    // ------------------------------------------------------------------
    // Salida (Archivo)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SalidaCarnetDTO.Reporte listar(LocalDate fechaParam) {
        return listarPorEstados(fechaParam, ESTADOS_SALIDA_ARCHIVO, Carnet::getSalidaArchivoEn);
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(LocalDate fechaParam, String usuarioGenerador) {
        return generarReporteSalida(listar(fechaParam), usuarioGenerador);
    }

    /** Genera el reporte de salida para un lote concreto de carnets (esta sesión). */
    @Transactional(readOnly = true)
    public byte[] generarPdfPorIds(List<UUID> ids, String usuarioGenerador) {
        List<UUID> idList = (ids != null) ? ids : List.of();
        List<SalidaCarnetDTO> items = carnetRepository.findAllById(idList).stream()
                .filter(carnet -> ESTADOS_SALIDA_ARCHIVO.contains(carnet.getEstado()))
                .sorted(Comparator
                        .comparing((Carnet c) -> c.getEspecialidad().getNombre())
                        .thenComparing(Carnet::getNumeroExpediente))
                .map(carnet -> new SalidaCarnetDTO(
                        carnet.getNumeroExpediente(),
                        carnet.getEspecialidad().getNombre(),
                        carnet.getPacienteNombre(),
                        formatearHora(carnet.getSalidaArchivoEn())))
                .toList();
        SalidaCarnetDTO.Reporte salida = new SalidaCarnetDTO.Reporte(LocalDate.now(ZONA_HORARIA),
                items.size(), items);
        return generarReporteSalida(salida, usuarioGenerador);
    }

    private byte[] generarReporteSalida(SalidaCarnetDTO.Reporte salida, String usuarioGenerador) {
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
    // Salida de enfermería (Mesa COEX)
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SalidaCarnetDTO.Reporte listarSalidaEnfermeria(LocalDate fechaParam) {
        return listarPorEstados(fechaParam, ESTADOS_SALIDA_ENFERMERIA, Carnet::getSalidaEnfermeriaEn);
    }

    @Transactional(readOnly = true)
    public byte[] generarSalidaEnfermeriaPdf(LocalDate fechaParam, String usuarioGenerador) {
        SalidaCarnetDTO.Reporte salida = listarSalidaEnfermeria(fechaParam);
        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "CONTROL DE SALIDA DE ENFERMERÍA",
                "Estación de Enfermería -> Archivo / Registro Médico",
                "SE-" + identificarFecha(salida.fecha()),
                salida.fecha(),
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Estación de Enfermería",
                "Archivo / Registro Médico",
                columnasExpedientes(),
                filasExpedientes(salida.expedientes()),
                salida.total(),
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
                new PlantillaReportePdf.Columna("No.", 0.6f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Expediente", 1.2f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Paciente", 2.4f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Especialidad", 1.6f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Hora de marcado", 0.9f, PlantillaReportePdf.Alineacion.CENTRO));
    }

    private static List<List<String>> filasExpedientes(List<SalidaCarnetDTO> items) {
        List<List<String>> filas = new java.util.ArrayList<>();
        int indice = 1;
        for (SalidaCarnetDTO item : items) {
            filas.add(List.of(
                    String.valueOf(indice++),
                    nvl(item.numeroExpediente()),
                    nvl(item.pacienteNombre()),
                    nvl(item.especialidadNombre()),
                    nvl(item.hora())));
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
        return instante.atZoneSameInstant(ZONA_HORARIA).format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private static String nvl(String valor) {
        return valor == null ? "" : valor;
    }
}
