package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.RegistrarSalidaEnfermeriaArchivoRequestDTO;
import com.hro.system.archivo.dto.SalidaEnfermeriaArchivoResponseDTO;
import com.hro.system.archivo.entity.SalidaEnfermeriaArchivo;
import com.hro.system.archivo.repository.SalidaEnfermeriaArchivoRepository;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
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
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalidaEnfermeriaArchivoService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");
    private static final Set<String> TIPOS = Set.of(
            "normal", "privado_libertad", "personal", "presentacion");

    private final SalidaEnfermeriaArchivoRepository repository;
    private final EstacionEnfermeriaRepository estacionRepository;
    private final EspacioFisicoRepository espacioFisicoRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final ExpedienteHroService expedienteHroService;
    private final PlantillaReportePdf plantilla;

    @Transactional
    public SalidaEnfermeriaArchivoResponseDTO registrar(
            RegistrarSalidaEnfermeriaArchivoRequestDTO dto) {
        LocalDate fecha = dto.getFecha() != null ? dto.getFecha() : LocalDate.now(ZONA_HORARIA);
        Long estacionId = dto.getEstacionId() != null
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
                            "El expediente ya fue registrado como salida de enfermería a archivo.");
                });

        String tipo = normalizarTipo(dto.getTipo());
        EspacioFisico clinicaPersonal = null;
        if ("personal".equals(tipo)) {
            if (dto.getClinicaPersonalId() == null) {
                throw new BusinessException("CLINICA_PERSONAL_REQUERIDA",
                        "Seleccione la clínica para el expediente de tipo Personal.");
            }
            clinicaPersonal = espacioFisicoRepository.findById(dto.getClinicaPersonalId())
                    .filter(espacio -> Boolean.TRUE.equals(espacio.getActivo()))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "EspacioFisico", "id", dto.getClinicaPersonalId()));
        }

        PacienteHroDTO paciente = expedienteHroService.consultar(numero);

        SalidaEnfermeriaArchivo salida = repository.save(SalidaEnfermeriaArchivo.builder()
                .fecha(fecha)
                .estacion(estacion)
                .numeroExpediente(numero)
                .pacienteNombre(paciente.getNombreCompleto())
                .tipo(tipo)
                .primeraVez(Boolean.TRUE.equals(dto.getPrimeraVez()))
                .clinicaPersonal(clinicaPersonal)
                .registradoPor(usuarioActual())
                .registradoEn(OffsetDateTime.now())
                .build());

        log.info("Salida Enfermería -> Archivo registrada: exp {} estación {} tipo {}",
                numero, estacion.getCodigo(), tipo);
        return map(salida);
    }

    @Transactional(readOnly = true)
    public List<SalidaEnfermeriaArchivoResponseDTO> listar(LocalDate fecha, Long estacionId) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now(ZONA_HORARIA);
        Long estacion = estacionId != null ? estacionId : EstacionContexto.idActual().orElse(null);
        if (estacion == null) {
            throw new BusinessException("Seleccione la estación para consultar las salidas.");
        }
        return repository.findByFechaAndEstacionIdOrderByRegistradoEnDesc(dia, estacion)
                .stream().map(this::map).toList();
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(LocalDate fechaParam, Long estacionId, String usuarioGenerador) {
        LocalDate fecha = fechaParam != null ? fechaParam : LocalDate.now(ZONA_HORARIA);
        Long estacion = estacionId != null ? estacionId : EstacionContexto.idActual().orElse(null);
        if (estacion == null) {
            throw new BusinessException("Seleccione la estación para generar el reporte.");
        }
        EstacionEnfermeria estacionEntidad = estacionRepository.findById(estacion)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "EstacionEnfermeria", "id", estacion));
        List<SalidaEnfermeriaArchivo> lista = repository
                .findByFechaAndEstacionIdOrderByRegistradoEnDesc(fecha, estacion);

        List<List<String>> filas = new ArrayList<>();
        int indice = 1;
        for (SalidaEnfermeriaArchivo salida : lista) {
            filas.add(List.of(
                    String.valueOf(indice++),
                    salida.getNumeroExpediente(),
                    salida.getPacienteNombre(),
                    etiquetaTipo(salida.getTipo()),
                    Boolean.TRUE.equals(salida.getPrimeraVez()) ? "Sí" : "No",
                    salida.getClinicaPersonal() != null ? salida.getClinicaPersonal().getNombre() : "",
                    formatearHora(salida.getRegistradoEn())));
        }

        String estacionTxt = (estacionEntidad.getCodigo() != null
                ? estacionEntidad.getCodigo() + " · " : "")
                + nvl(estacionEntidad.getNombre());
        PlantillaReportePdf.Reporte reporte = new PlantillaReportePdf.Reporte(
                "CONTROL DE SALIDA DE ENFERMERÍA A ARCHIVO",
                "Enfermería -> Archivo · Estación: " + estacionTxt,
                "SALENF-" + fecha.format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                fecha,
                OffsetDateTime.now(ZONA_HORARIA),
                nvl(usuarioGenerador),
                "Enfermería",
                "Archivo",
                columnas(),
                filas,
                lista.size(),
                "Entrega - Enfermería",
                "Recibe - Archivo",
                "");
        try {
            return plantilla.generar(reporte);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo generar el PDF de salida: " + e.getMessage(), e);
        }
    }

    private static List<PlantillaReportePdf.Columna> columnas() {
        return List.of(
                new PlantillaReportePdf.Columna("#", 0.5f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Expediente", 1.2f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Paciente", 2.4f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Etiqueta", 1.2f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Primera vez", 0.9f, PlantillaReportePdf.Alineacion.CENTRO),
                new PlantillaReportePdf.Columna("Clínica", 1.2f, PlantillaReportePdf.Alineacion.IZQUIERDA),
                new PlantillaReportePdf.Columna("Hora", 0.8f, PlantillaReportePdf.Alineacion.CENTRO));
    }

    private SalidaEnfermeriaArchivoResponseDTO map(SalidaEnfermeriaArchivo salida) {
        return SalidaEnfermeriaArchivoResponseDTO.builder()
                .id(salida.getId())
                .fecha(salida.getFecha())
                .estacionId(salida.getEstacion() != null ? salida.getEstacion().getId() : null)
                .estacionNombre(salida.getEstacion() != null ? salida.getEstacion().getNombre() : null)
                .numeroExpediente(salida.getNumeroExpediente())
                .pacienteNombre(salida.getPacienteNombre())
                .tipo(salida.getTipo())
                .primeraVez(Boolean.TRUE.equals(salida.getPrimeraVez()))
                .clinicaPersonalId(salida.getClinicaPersonal() != null
                        ? salida.getClinicaPersonal().getId() : null)
                .clinicaPersonalNombre(salida.getClinicaPersonal() != null
                        ? salida.getClinicaPersonal().getNombre() : null)
                .registradoPor(salida.getRegistradoPor() != null
                        ? salida.getRegistradoPor().getNombreMostrar() : null)
                .registradoEn(salida.getRegistradoEn())
                .build();
    }

    private static String normalizarTipo(String valor) {
        String tipo = valor == null || valor.isBlank() ? "normal" : valor.trim().toLowerCase(Locale.ROOT);
        if (!TIPOS.contains(tipo)) {
            throw new BusinessException("TIPO_SALIDA_INVALIDO", "Tipo de salida inválido: " + valor);
        }
        return tipo;
    }

    private static String etiquetaTipo(String tipo) {
        return switch (tipo) {
            case "privado_libertad" -> "Privado de libertad";
            case "personal" -> "Personal";
            case "presentacion" -> "Presentación";
            default -> "Normal";
        };
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
