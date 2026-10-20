package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.RegistrarSalidaArchivoHospitalRequestDTO;
import com.hro.system.archivo.dto.SalidaArchivoHospitalResponseDTO;
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
import java.util.List;

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
    private final PlantillaReportePdf plantilla;

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

        // Consulta DIRECTA al API del hospital (404 si no existe, 502 si falla).
        PacienteHroDTO paciente = expedienteHroService.consultar(numero);

        UsuarioReferencia usuario = usuarioActual();
        SalidaArchivoHospital salida = repository.save(SalidaArchivoHospital.builder()
                .fecha(fecha)
                .estacion(estacion)
                .numeroExpediente(numero)
                .pacienteNombre(paciente.getNombreCompleto())
                .registradoPor(usuario)
                .registradoEn(OffsetDateTime.now())
                .build());

        log.info("Salida de archivo (hospital) registrada: exp {} estación {} usuario {}",
                numero, estacion.getCodigo(), usuario != null ? usuario.getId() : null);
        return map(salida);
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
        for (SalidaArchivoHospital s : lista) {
            filas.add(List.of(
                    String.valueOf(indice++),
                    s.getNumeroExpediente(),
                    s.getPacienteNombre(),
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
                "");
        try {
            return plantilla.generar(reporte);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el PDF de salida: " + e.getMessage(), e);
        }
    }

    // ------------------------------------------------------------------

    private static List<PlantillaReportePdf.Columna> columnas() {
        return List.of(
                new PlantillaReportePdf.Columna("#", 0.5f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Expediente", 1.2f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Paciente", 2.6f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Hora", 0.8f, PlantillaReportePdf.Alineacion.CENTRO));
    }

    private SalidaArchivoHospitalResponseDTO map(SalidaArchivoHospital s) {
        return SalidaArchivoHospitalResponseDTO.builder()
                .id(s.getId())
                .fecha(s.getFecha())
                .estacionId(s.getEstacion() != null ? s.getEstacion().getId() : null)
                .estacionNombre(s.getEstacion() != null ? s.getEstacion().getNombre() : null)
                .numeroExpediente(s.getNumeroExpediente())
                .pacienteNombre(s.getPacienteNombre())
                .registradoPor(s.getRegistradoPor() != null ? s.getRegistradoPor().getNombreMostrar() : null)
                .registradoEn(s.getRegistradoEn())
                .build();
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
}
