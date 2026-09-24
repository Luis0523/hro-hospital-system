package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.ActaRecepcionDetalleDTO;
import com.hro.system.archivo.dto.ActaRecepcionResumenDTO;
import com.hro.system.archivo.dto.ActaRecepcionResponseDTO;
import com.hro.system.archivo.dto.CrearActaRecepcionRequestDTO;
import com.hro.system.archivo.entity.ActaRecepcion;
import com.hro.system.archivo.entity.ActaRecepcionDetalle;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.repository.ActaRecepcionRepository;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Actas de entrega/recepción de expedientes físicos y su PDF.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ActaRecepcionService {

    private final ActaRecepcionRepository actaRepository;
    private final ExpedienteRepository expedienteRepository;
    private final ExpedienteCicloRepository expedienteCicloRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final ArchivoPdfService pdfService;

    @Transactional
    public ActaRecepcionResponseDTO crear(CrearActaRecepcionRequestDTO dto) {
        LocalDate fecha = (dto.getFecha() != null) ? dto.getFecha() : LocalDate.now();

        Subespecialidad subespecialidad = null;
        if (dto.getSubespecialidadId() != null) {
            subespecialidad = subespecialidadRepository.findById(dto.getSubespecialidadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", dto.getSubespecialidadId()));
        }

        UsuarioReferencia creadoPor = usuarioActual();
        UsuarioReferencia entrega = (dto.getUsuarioEntregaId() != null)
                ? buscarUsuario(dto.getUsuarioEntregaId())
                : creadoPor;
        UsuarioReferencia recibe = (dto.getUsuarioRecibeId() != null)
                ? buscarUsuario(dto.getUsuarioRecibeId())
                : null;

        List<UUID> idsUnicos = List.copyOf(new LinkedHashSet<>(dto.getExpedienteIds()));
        List<Expediente> expedientes = expedienteRepository.findAllById(idsUnicos);
        if (expedientes.size() != idsUnicos.size()) {
            throw new ResourceNotFoundException("Expediente", "ids", idsUnicos);
        }

        // Cita asociada (si el expediente tiene un ciclo para esa fecha).
        Map<UUID, ExpedienteCiclo> cicloPorExpediente = expedienteCicloRepository.buscarPorFecha(fecha).stream()
                .collect(Collectors.toMap(c -> c.getExpediente().getId(), Function.identity(), (a, b) -> a));

        ActaRecepcion acta = ActaRecepcion.builder()
                .numeroActa(generarNumeroActa(fecha.getYear()))
                .fecha(fecha)
                .subespecialidad(subespecialidad)
                .usuarioEntrega(entrega)
                .usuarioRecibe(recibe)
                .observaciones(dto.getObservaciones())
                .creadoPor(creadoPor)
                .creadoEn(OffsetDateTime.now())
                .build();

        for (Expediente expediente : expedientes) {
            ExpedienteCiclo ciclo = cicloPorExpediente.get(expediente.getId());
            acta.agregarDetalle(ActaRecepcionDetalle.builder()
                    .expediente(expediente)
                    .cita(ciclo != null ? ciclo.getCita() : null)
                    .build());
        }

        ActaRecepcion guardada = actaRepository.save(acta);
        log.info("Acta {} creada con {} expediente(s)", guardada.getNumeroActa(), guardada.getDetalles().size());
        return mapToDTO(guardada);
    }

    @Transactional(readOnly = true)
    public ActaRecepcionResponseDTO obtener(Long id) {
        return mapToDTO(buscarActa(id));
    }

    @Transactional(readOnly = true)
    public List<ActaRecepcionResumenDTO> listar(LocalDate fecha, Long subespecialidadId) {
        return actaRepository.buscar(fecha, subespecialidadId).stream()
                .map(this::mapResumen)
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long id) {
        return pdfService.generarActaPdf(buscarActa(id));
    }

    private ActaRecepcion buscarActa(Long id) {
        return actaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ActaRecepcion", "id", id));
    }

    private UsuarioReferencia buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", id));
    }

    private UsuarioReferencia usuarioActual() {
        Long usuarioId = UsuarioContexto.idActual();
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));
    }

    private String generarNumeroActa(int anio) {
        String prefijo = "ACT-" + anio + "-";
        long siguiente = actaRepository.countByNumeroActaStartingWith(prefijo) + 1;
        return String.format("%s%04d", prefijo, siguiente);
    }

    private ActaRecepcionResponseDTO mapToDTO(ActaRecepcion acta) {
        List<ActaRecepcionDetalleDTO> detalles = acta.getDetalles().stream()
                .map(this::mapDetalle)
                .toList();

        return ActaRecepcionResponseDTO.builder()
                .id(acta.getId())
                .numeroActa(acta.getNumeroActa())
                .fecha(acta.getFecha())
                .subespecialidadId(acta.getSubespecialidad() != null ? acta.getSubespecialidad().getId() : null)
                .subespecialidadNombre(acta.getSubespecialidad() != null ? acta.getSubespecialidad().getNombre() : null)
                .usuarioEntregaId(acta.getUsuarioEntrega().getId())
                .usuarioEntregaNombre(acta.getUsuarioEntrega().getNombreMostrar())
                .usuarioRecibeId(acta.getUsuarioRecibe() != null ? acta.getUsuarioRecibe().getId() : null)
                .usuarioRecibeNombre(acta.getUsuarioRecibe() != null ? acta.getUsuarioRecibe().getNombreMostrar() : null)
                .observaciones(acta.getObservaciones())
                .creadoPorNombre(acta.getCreadoPor().getNombreMostrar())
                .creadoEn(acta.getCreadoEn())
                .totalExpedientes(detalles.size())
                .detalles(detalles)
                .build();
    }

    private ActaRecepcionDetalleDTO mapDetalle(ActaRecepcionDetalle detalle) {
        Expediente expediente = detalle.getExpediente();
        return ActaRecepcionDetalleDTO.builder()
                .id(detalle.getId())
                .expedienteId(expediente.getId())
                .numeroExpediente(expediente.getNumeroExpediente())
                .pacienteId(expediente.getPaciente().getId())
                .pacienteNombre(expediente.getPaciente().getNombres() + " " + expediente.getPaciente().getApellidos())
                .citaId(detalle.getCita() != null ? detalle.getCita().getId() : null)
                .build();
    }

    private ActaRecepcionResumenDTO mapResumen(ActaRecepcion acta) {
        return ActaRecepcionResumenDTO.builder()
                .id(acta.getId())
                .numeroActa(acta.getNumeroActa())
                .fecha(acta.getFecha())
                .subespecialidadId(acta.getSubespecialidad() != null ? acta.getSubespecialidad().getId() : null)
                .subespecialidadNombre(acta.getSubespecialidad() != null ? acta.getSubespecialidad().getNombre() : null)
                .creadoPorNombre(acta.getCreadoPor().getNombreMostrar())
                .totalExpedientes(acta.getDetalles().size())
                .creadoEn(acta.getCreadoEn())
                .build();
    }
}
