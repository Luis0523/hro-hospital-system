package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.EtiquetaArchivoResumenDTO;
import com.hro.system.archivo.dto.RegistrarSalidaArchivoHospitalRequestDTO;
import com.hro.system.archivo.dto.RegistrarSalidaArchivoManualRequestDTO;
import com.hro.system.archivo.dto.SalidaArchivoHospitalResponseDTO;
import com.hro.system.archivo.entity.EtiquetaArchivo;
import com.hro.system.archivo.entity.SalidaArchivoHospital;
import com.hro.system.archivo.repository.SalidaArchivoHospitalRepository;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.estacion.context.EstacionContexto;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.service.ExpedienteHroService;
import com.hro.system.reporte.FormatoExpediente;
import com.hro.system.reporte.PlantillaReportePdf;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Registro de salidas de archivo consultadas DIRECTAMENTE al API del hospital
 * (Registro Médico). Compartido por estación y fecha: varios operadores de la
 * misma estación ven y marcan el mismo listado. Independiente de los carnets de
 * enfermería.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalidaArchivoHospitalService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    private final SalidaArchivoHospitalRepository repository;
    private final EstacionEnfermeriaRepository estacionRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final ExpedienteHroService expedienteHroService;
    private final EtiquetaArchivoService etiquetaService;
    private final PlantillaReportePdf plantilla;
    private final com.hro.system.parametro.service.ParametroSistemaService parametros;

    @Transactional
    public SalidaArchivoHospitalResponseDTO registrar(RegistrarSalidaArchivoHospitalRequestDTO dto) {
        LocalDate fecha = (dto.getFecha() != null) ? dto.getFecha() : LocalDate.now(ZONA_HORARIA);
        Long estacionId = (dto.getEstacionId() != null)
                ? dto.getEstacionId()
                : EstacionContexto.idActual().orElse(null);
        if (estacionId == null) {
            throw new BusinessException("Seleccione la estación antes de registrar la salida.");
        }
        EstacionEnfermeria estacion = estacionRepository.findById(estacionId)
                .orElseThrow(() -> new ResourceNotFoundException("EstacionEnfermeria", "id", estacionId));

        String numero = dto.getNumeroExpediente().trim();
        repository.findByFechaAndEstacionIdAndNumeroExpediente(fecha, estacionId, numero)
                .ifPresent(existente -> {
                    throw new ConflictException("SALIDA_DUPLICADA",
                            "El expediente ya fue marcado como salida en esta estación.");
                });

        // Etiqueta configurada para la estación (opcional). Se valida antes de
        // consultar al hospital para no registrar salidas con datos inválidos.
        EtiquetaArchivo etiqueta = etiquetaService.resolverParaSalida(estacionId, dto.getEtiquetaId());
        if (etiqueta == null && Boolean.TRUE.equals(dto.getEsClinicaMujer())) {
            etiqueta = etiquetaService.resolverClinicaMujer();
        }
        boolean esClinicaMujer = (etiqueta != null)
                ? EtiquetaArchivoService.CODIGO_CLINICA_MUJER.equals(etiqueta.getCodigo())
                : Boolean.TRUE.equals(dto.getEsClinicaMujer());

        // Consulta DIRECTA al API del hospital (404 si no existe, 502 si falla).
        PacienteHroDTO paciente = expedienteHroService.consultar(numero);

        UsuarioReferencia usuario = usuarioActual();
        SalidaArchivoHospital salida = repository.save(SalidaArchivoHospital.builder()
                .fecha(fecha)
                .estacion(estacion)
                .numeroExpediente(numero)
                .pacienteNombre(paciente.getNombreCompleto())
                .etiqueta(etiqueta)
                .esClinicaMujer(esClinicaMujer)
                .registradoPor(usuario)
                .registradoEn(OffsetDateTime.now())
                .build());

        log.info("Salida de archivo (hospital) registrada: exp {} estación {} usuario {}",
                numero, estacion.getCodigo(), usuario != null ? usuario.getId() : null);
        return map(salida);
    }

    /**
     * Registro manual para expedientes que el API del hospital no reconoce.
     * No consulta ni actualiza el hospital: guarda el número y el nombre tal
     * como los escribe el operador, para el listado y el reporte del día.
     */
    @Transactional
    public SalidaArchivoHospitalResponseDTO registrarManual(RegistrarSalidaArchivoManualRequestDTO dto) {
        LocalDate fecha = (dto.getFecha() != null) ? dto.getFecha() : LocalDate.now(ZONA_HORARIA);
        Long estacionId = (dto.getEstacionId() != null)
                ? dto.getEstacionId()
                : EstacionContexto.idActual().orElse(null);
        if (estacionId == null) {
            throw new BusinessException("Seleccione la estación antes de registrar la salida.");
        }
        EstacionEnfermeria estacion = estacionRepository.findById(estacionId)
                .orElseThrow(() -> new ResourceNotFoundException("EstacionEnfermeria", "id", estacionId));

        String numero = dto.getNumeroExpediente().trim();
        repository.findByFechaAndEstacionIdAndNumeroExpediente(fecha, estacionId, numero)
                .ifPresent(existente -> {
                    throw new ConflictException("SALIDA_DUPLICADA",
                            "El expediente ya fue marcado como salida en esta estación.");
                });

        EtiquetaArchivo etiqueta = etiquetaService.resolverParaSalida(estacionId, dto.getEtiquetaId());
        boolean esClinicaMujer = (etiqueta != null)
                && EtiquetaArchivoService.CODIGO_CLINICA_MUJER.equals(etiqueta.getCodigo());

        UsuarioReferencia usuario = usuarioActual();
        SalidaArchivoHospital salida = repository.save(SalidaArchivoHospital.builder()
                .fecha(fecha)
                .estacion(estacion)
                .numeroExpediente(numero)
                .pacienteNombre(dto.getPacienteNombre().trim())
                .etiqueta(etiqueta)
                .esClinicaMujer(esClinicaMujer)
                .registradoPor(usuario)
                .registradoEn(OffsetDateTime.now())
                .build());

        log.info("Salida de archivo MANUAL registrada: exp {} estación {} usuario {}",
                numero, estacion.getCodigo(), usuario != null ? usuario.getId() : null);
        return map(salida);
    }

    @Transactional
    public void eliminar(UUID id) {
        SalidaArchivoHospital salida = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SalidaArchivoHospital", "id", id));
        repository.delete(salida);
        log.info("Salida de archivo eliminada: id {} exp {}", id, salida.getNumeroExpediente());
    }

    @Transactional(readOnly = true)
    public List<SalidaArchivoHospitalResponseDTO> listar(LocalDate fecha, Long estacionId) {
        LocalDate dia = (fecha != null) ? fecha : LocalDate.now(ZONA_HORARIA);
        List<SalidaArchivoHospital> lista = (estacionId != null)
                ? repository.findByFechaAndEstacionIdOrderByRegistradoEnDesc(dia, estacionId)
                : repository.findByFechaOrderByRegistradoEnDesc(dia);
        return lista.stream().map(this::map).toList();
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(LocalDate fechaParam, Long estacionId, String usuarioGenerador) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now(ZONA_HORARIA);
        List<SalidaArchivoHospital> lista = (estacionId != null)
                ? repository.findByFechaAndEstacionIdOrderByRegistradoEnDesc(fecha, estacionId)
                : repository.findByFechaOrderByRegistradoEnDesc(fecha);

        List<List<String>> filas = new ArrayList<>();
        int indice = 1;
        Long umbral = umbralActivo();
        for (SalidaArchivoHospital s : lista) {
            String clasificacion = clasificar(s.getNumeroExpediente(), umbral);
            filas.add(List.of(
                    String.valueOf(indice++),
                    FormatoExpediente.formatear(s.getNumeroExpediente()),
                    s.getPacienteNombre(),
                    clasificacion != null ? clasificacion : "-",
                    nombreEtiqueta(s),
                    formatearHora(s.getRegistradoEn())));
        }

        String estacionTxt = (estacionId != null)
                ? lista.stream().findFirst().map(s -> s.getEstacion() != null ? s.getEstacion().getNombre() : "")
                        .orElse("")
                : "";

        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "CONTROL DE SALIDA DE EXPEDIENTES",
                "Archivo / Registro Médico -> Consulta Externa"
                        + (estacionTxt.isBlank() ? "" : " · " + estacionTxt),
                "SALH-" + fecha.format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                fecha,
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Archivo / Registro Médico",
                "Consulta Externa",
                columnas(),
                filas,
                lista.size(),
                "Entrega - Archivo",
                "Recibe - Consulta Externa",
                "",
                true,
                resumenEtiquetas(lista));
        try {
            return plantilla.generar(reporte);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el PDF de salida: " + e.getMessage(), e);
        }
    }

    // ------------------------------------------------------------------

    private static List<PlantillaReportePdf.Columna> columnas() {
        return List.of(
                new PlantillaReportePdf.Columna("#", 0.4f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Expediente", 1.1f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Paciente", 2.2f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Clasificación", 0.9f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Etiqueta", 1.3f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Hora", 0.8f, PlantillaReportePdf.Alineacion.CENTRO));
    }

    private static String nombreEtiqueta(SalidaArchivoHospital s) {
        if (s.getEtiqueta() != null) {
            return s.getEtiqueta().getNombre();
        }
        return Boolean.TRUE.equals(s.isEsClinicaMujer()) ? "Clínica de la Mujer" : "-";
    }

    /**
     * Totales por etiqueta para el encabezado del PDF. Se ordenan por el orden
     * del catálogo y "Sin etiqueta" queda al final.
     */
    private static List<String> resumenEtiquetas(List<SalidaArchivoHospital> lista) {
        Map<String, Integer> conteos = new LinkedHashMap<>();
        Map<String, Integer> ordenes = new HashMap<>();
        for (SalidaArchivoHospital s : lista) {
            String nombre = nombreEtiqueta(s);
            conteos.merge(nombre, 1, Integer::sum);
            if (s.getEtiqueta() != null) {
                ordenes.putIfAbsent(nombre,
                        s.getEtiqueta().getOrden() != null ? s.getEtiqueta().getOrden() : Integer.MAX_VALUE);
            }
        }
        return conteos.entrySet().stream()
                .sorted(Comparator
                        .comparingInt((Map.Entry<String, Integer> e) -> "Sin etiqueta".equals(e.getKey())
                                ? Integer.MAX_VALUE
                                : ordenes.getOrDefault(e.getKey(), Integer.MAX_VALUE))
                        .thenComparing(Map.Entry::getKey))
                .map(e -> e.getKey() + ": " + e.getValue())
                .toList();
    }

    private SalidaArchivoHospitalResponseDTO map(SalidaArchivoHospital s) {
        return SalidaArchivoHospitalResponseDTO.builder()
                .id(s.getId())
                .fecha(s.getFecha())
                .estacionId(s.getEstacion() != null ? s.getEstacion().getId() : null)
                .estacionNombre(s.getEstacion() != null ? s.getEstacion().getNombre() : null)
                .numeroExpediente(s.getNumeroExpediente())
                .pacienteNombre(s.getPacienteNombre())
                .etiqueta(resumenEtiqueta(s.getEtiqueta()))
                .esClinicaMujer(s.isEsClinicaMujer())
                .clasificacion(clasificar(s.getNumeroExpediente(), umbralActivo()))
                .registradoPor(s.getRegistradoPor() != null ? s.getRegistradoPor().getNombreMostrar() : null)
                .registradoEn(s.getRegistradoEn())
                .build();
    }

    private static EtiquetaArchivoResumenDTO resumenEtiqueta(EtiquetaArchivo etiqueta) {
        if (etiqueta == null) {
            return null;
        }
        return new EtiquetaArchivoResumenDTO(
                etiqueta.getId(),
                etiqueta.getCodigo(),
                etiqueta.getNombre(),
                etiqueta.getIcono(),
                etiqueta.getColor());
    }

    private UsuarioReferencia usuarioActual() {
        return UsuarioContexto.actual()
                .map(identidad -> usuarioRepository.findById(identidad.id()).orElse(null))
                .orElse(null);
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
}
