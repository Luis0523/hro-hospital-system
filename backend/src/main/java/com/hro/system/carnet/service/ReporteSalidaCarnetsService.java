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

/**
 * Reporte de SALIDA de expedientes: únicamente los carnets ENCONTRADOS (los que
 * salen del archivo), ordenados por especialidad y luego por número de expediente.
 * Reutiliza la plantilla institucional {@link PlantillaReportePdf} (A4 vertical).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteSalidaCarnetsService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    // "Encontrados": ya salieron o están en tránsito; se excluyen registrado y no_localizado.
    private static final Set<String> ESTADOS_ENCONTRADOS = Set.of(
            "encontrado", "despachado", "recibido_estacion", "devuelto_estacion", "recibido_archivo");

    private final CarnetRepository carnetRepository;
    private final PlantillaReportePdf plantilla;

    @Transactional(readOnly = true)
    public SalidaCarnetDTO.Reporte listar(LocalDate fechaParam) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now(ZONA_HORARIA);
        List<SalidaCarnetDTO> items = carnetRepository.listarPorFecha(fecha).stream()
                .filter(carnet -> ESTADOS_ENCONTRADOS.contains(carnet.getEstado()))
                .sorted(Comparator
                        .comparing((Carnet c) -> c.getEspecialidad().getNombre())
                        .thenComparing(Carnet::getNumeroExpediente))
                .map(carnet -> new SalidaCarnetDTO(
                        carnet.getNumeroExpediente(),
                        carnet.getEspecialidad().getNombre(),
                        carnet.getPacienteNombre(),
                        horaDe(carnet)))
                .toList();
        return new SalidaCarnetDTO.Reporte(fecha, items.size(), items);
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(LocalDate fechaParam, String usuarioGenerador) {
        SalidaCarnetDTO.Reporte salida = listar(fechaParam);
        List<List<String>> filas = new java.util.ArrayList<>();
        int indice = 1;
        for (SalidaCarnetDTO item : salida.expedientes()) {
            filas.add(List.of(
                    String.valueOf(indice++),
                    nvl(item.numeroExpediente()),
                    nvl(item.especialidadNombre()),
                    nvl(item.pacienteNombre())));
        }

        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "CONTROL DE SALIDA DE EXPEDIENTES",
                "Archivo / Registro Médico -> Consulta Externa (COEX)",
                "SAL-" + salida.fecha().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                salida.fecha(),
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Archivo / Registro Médico",
                "Consulta Externa (COEX)",
                List.of(
                        new PlantillaReportePdf.Columna("#", 0.6f, PlantillaReportePdf.Alineacion.CENTRO),
                        new PlantillaReportePdf.Columna("Expediente", 1.3f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                        new PlantillaReportePdf.Columna("Especialidad", 1.7f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                        new PlantillaReportePdf.Columna("Paciente", 2.6f, PlantillaReportePdf.Alineacion.IZQUIERDA)),
                filas,
                salida.total(),
                "Entrega - Archivo",
                "Recibe - COEX / Enfermería",
                "");
        try {
            return plantilla.generar(reporte);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo generar el reporte de salida: " + e.getMessage(), e);
        }
    }

    private static String horaDe(Carnet carnet) {
        if (carnet.getRegistradoEn() == null) {
            return "";
        }
        return carnet.getRegistradoEn().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private static String nvl(String valor) {
        return valor == null ? "" : valor;
    }
}
