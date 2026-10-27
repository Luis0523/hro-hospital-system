package com.hro.system.carnet.service;

import com.hro.system.carnet.dto.CarnetMovimientoResponseDTO;
import com.hro.system.carnet.dto.CarnetResponseDTO;
import com.hro.system.carnet.dto.SalidaCarnetDTO;
import com.hro.system.archivo.entity.SalidaArchivoHospital;
import com.hro.system.archivo.repository.SalidaArchivoHospitalRepository;
import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.reporte.FormatoExpediente;
import com.hro.system.reporte.PlantillaExpedientesArchivados;
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
    private final SalidaArchivoHospitalRepository salidaArchivoHospitalRepository;
    private final PlantillaReportePdf plantilla;
    private final PlantillaExpedientesArchivados plantillaArchivados;
    private final com.hro.system.parametro.service.ParametroSistemaService parametros;

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
    // Expedientes archivados (pasivos del día)
    // ------------------------------------------------------------------

    /**
     * PDF "EXPEDIENTES ARCHIVADOS" con TODOS los expedientes clasificados como
     * <b>pasivos</b> (número de expediente menor o igual al umbral de archivo) de
     * la fecha indicada, ordenados de menor a mayor. La columna de fecha se deja
     * en blanco por ahora. El encabezado incluye la hora y quién lo genera.
     */
    @Transactional(readOnly = true)
    public byte[] generarArchivadosPdf(LocalDate fechaParam, String usuarioGenerador) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now(ZONA_HORARIA);
        Long umbral = umbralActivo();

        List<SalidaArchivoHospital> pasivos = salidaArchivoHospitalRepository
                .findByFechaOrderByRegistradoEnDesc(fecha).stream()
                .filter(salida -> "pasivo".equals(clasificar(salida.getNumeroExpediente(), umbral)))
                .sorted(Comparator.comparingLong(s -> parseNumero(s.getNumeroExpediente())))
                .toList();

        List<PlantillaExpedientesArchivados.Item> items = new java.util.ArrayList<>();
        int numero = 1;
        for (SalidaArchivoHospital salida : pasivos) {
            items.add(new PlantillaExpedientesArchivados.Item(
                    numero++, FormatoExpediente.formatear(salida.getNumeroExpediente()), null));
        }

        try {
            return plantillaArchivados.generar(
                    "EXPEDIENTES ARCHIVADOS", items, null,
                    OffsetDateTime.now(ZONA_HORARIA), nvl(usuarioGenerador));
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el PDF de expedientes archivados: " + e.getMessage(), e);
        }
    }

    private Long umbralActivo() {
        String valor = parametros.obtener(
                com.hro.system.parametro.service.ParametroSistemaService.UMBRAL_ARCHIVO_ACTIVO, null);
        try {
            return (valor != null && !valor.isBlank()) ? Long.valueOf(valor.trim()) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String clasificar(String numeroExpediente, Long umbral) {
        if (umbral == null || numeroExpediente == null) {
            return null;
        }
        try {
            return Long.parseLong(numeroExpediente.trim()) > umbral ? "activo" : "pasivo";
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static long parseNumero(String numeroExpediente) {
        try {
            return Long.parseLong(numeroExpediente.trim());
        } catch (Exception e) {
            return Long.MAX_VALUE;
        }
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
    // Trazabilidad de un expediente
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public byte[] generarTrazabilidadPdf(CarnetResponseDTO carnet, String usuarioGenerador) {
        List<List<String>> filas = new java.util.ArrayList<>();
        int indice = 1;
        for (CarnetMovimientoResponseDTO movimiento : carnet.getMovimientos()) {
            filas.add(List.of(
                    String.valueOf(indice++),
                    formatearFechaHora(movimiento.getFechaMovimiento()),
                    nvl(estadoLegible(movimiento.getEstadoNuevo())),
                    nvl(movimiento.getUsuarioNombre()),
                    nvl(movimiento.getObservacion())));
        }

        String clasificacion = nvl(carnet.getArchivo());
        String detalle = "Expediente: " + FormatoExpediente.formatear(carnet.getNumeroExpediente())
                + " · Paciente: " + nvl(carnet.getPacienteNombre())
                + " · Estado actual: " + estadoLegible(carnet.getEstado())
                + " · Clasificación: " + (clasificacion.isBlank() ? "sin clasificar" : clasificacion)
                + " · Estación: " + nvl(carnet.getEstacionNombre());

        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "TRAZABILIDAD DE EXPEDIENTE",
                detalle,
                "TRZ-" + FormatoExpediente.formatear(carnet.getNumeroExpediente()),
                carnet.getFecha(),
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Archivo / Registro Médico",
                "Jefe de Archivo",
                columnasTrazabilidad(),
                filas,
                filas.size(),
                "Entrega - Archivo",
                "Recibe - Jefatura de Archivo",
                detalle);
        return generar(reporte);
    }

    private static List<PlantillaReportePdf.Columna> columnasTrazabilidad() {
        return List.of(
                new PlantillaReportePdf.Columna("#", 0.4f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Fecha y hora", 1.3f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Estado", 1.3f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Encargado", 1.5f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Observación", 2.0f, PlantillaReportePdf.Alineacion.IZQUIERDA));
    }

    private static String estadoLegible(String estado) {
        if (estado == null) {
            return "";
        }
        return switch (estado) {
            case "registrado" -> "Registrado";
            case "no_localizado" -> "No localizado";
            case "salida_archivo" -> "Salida de archivo";
            case "salida_enfermeria" -> "Salida de enfermería";
            case "resguardado" -> "Resguardado";
            default -> estado;
        };
    }

    private static String formatearFechaHora(OffsetDateTime instante) {
        if (instante == null) {
            return "";
        }
        return instante.atZoneSameInstant(ZONA_HORARIA)
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
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
                    FormatoExpediente.formatear(item.numeroExpediente()),
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
