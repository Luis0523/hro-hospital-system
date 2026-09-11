package com.hro.system.cita.service;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.cita.dto.CambiarEstadoCitaRequestDTO;
import com.hro.system.cita.dto.CitaHistorialResponseDTO;
import com.hro.system.cita.dto.CitaResponseDTO;
import com.hro.system.cita.dto.CrearCitaRequestDTO;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.entity.CitaEstadoHistorial;
import com.hro.system.cita.repository.CitaEstadoHistorialRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CitaService {

    private final CitaRepository citaRepository;
    private final CitaEstadoHistorialRepository historialRepository;
    private final PacienteRepository pacienteRepository;
    private final CupoDiarioRepository cupoDiarioRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public CitaResponseDTO agendarCita(CrearCitaRequestDTO dto) {
        Paciente paciente = pacienteRepository.findById(dto.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "id", dto.getPacienteId()));

        CupoDiario cupo = cupoDiarioRepository.findById(dto.getCupoDiarioId())
                .orElseThrow(() -> new ResourceNotFoundException("CupoDiario", "id", dto.getCupoDiarioId()));

        UsuarioReferencia usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", dto.getUsuarioId()));

        // Actualización atómica en Postgres para evitar sobrecupos ante concurrencia
        boolean cupoAsignado = cupoDiarioRepository.incrementarCupoAtomico(cupo.getId());
        if (!cupoAsignado) {
            throw new BusinessException("No hay cupos disponibles para la clínica y fecha seleccionada");
        }

        Cita citaOrigen = null;
        if (dto.getCitaOrigenId() != null) {
            citaOrigen = citaRepository.findById(dto.getCitaOrigenId()).orElse(null);
        }

        Cita nuevaCita = Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo)
                .horaEstimada(dto.getHoraEstimada())
                .horaVentanaInicio(dto.getHoraVentanaInicio())
                .horaVentanaFin(dto.getHoraVentanaFin())
                .estado("pendiente")
                .citaOrigen(citaOrigen)
                .registradoPor(usuario)
                .version(0)
                .creadoEn(OffsetDateTime.now())
                .actualizadoEn(OffsetDateTime.now())
                .build();

        Cita citaGuardada = citaRepository.save(nuevaCita);

        // Registro de auditoría específico de estados de la cita
        CitaEstadoHistorial historial = CitaEstadoHistorial.builder()
                .cita(citaGuardada)
                .estadoAnterior(null)
                .estadoNuevo("pendiente")
                .usuarioReferencia(usuario)
                .motivo("Agendamiento inicial de la cita")
                .fechaCambio(OffsetDateTime.now())
                .build();
        historialRepository.save(historial);

        // Emisión de evento para la bitácora general del sistema
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("cita")
                .entidadId(citaGuardada.getId())
                .accion("crear")
                .usuarioReferenciaId(usuario.getId())
                .valoresAnteriores(null)
                .valoresNuevos(Map.of(
                        "pacienteId", paciente.getId(),
                        "cupoDiarioId", cupo.getId(),
                        "estado", "pendiente"
                ))
                .build());

        log.info("Cita agendada exitosamente con ID: {} para paciente DPI: {}", citaGuardada.getId(), paciente.getDpi());
        return mapToDTO(citaGuardada);
    }

    @Transactional
    public CitaResponseDTO cambiarEstadoCita(Long citaId, CambiarEstadoCitaRequestDTO dto) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", citaId));

        UsuarioReferencia usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", dto.getUsuarioId()));

        String estadoAnterior = cita.getEstado();
        cita.setEstado(dto.getNuevoEstado());
        cita.setActualizadoEn(OffsetDateTime.now());

        Cita citaActualizada = citaRepository.save(cita);

        // Registro de auditoría de transición de estado
        CitaEstadoHistorial historial = CitaEstadoHistorial.builder()
                .cita(citaActualizada)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(dto.getNuevoEstado())
                .usuarioReferencia(usuario)
                .motivo(dto.getMotivo() != null ? dto.getMotivo() : "Cambio de estado operativo")
                .fechaCambio(OffsetDateTime.now())
                .build();
        historialRepository.save(historial);

        // Emisión de evento para la bitácora general
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("cita")
                .entidadId(citaActualizada.getId())
                .accion("actualizar")
                .usuarioReferenciaId(usuario.getId())
                .valoresAnteriores(Map.of("estado", estadoAnterior))
                .valoresNuevos(Map.of("estado", dto.getNuevoEstado(), "motivo", historial.getMotivo()))
                .build());

        return mapToDTO(citaActualizada);
    }

    @Transactional(readOnly = true)
    public List<CitaResponseDTO> listarCitasPorPaciente(Long pacienteId) {
        return citaRepository.findByPacienteId(pacienteId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CitaHistorialResponseDTO> obtenerHistorialCita(Long citaId) {
        return historialRepository.findByCitaIdOrderByFechaCambioDesc(citaId).stream()
                .map(h -> CitaHistorialResponseDTO.builder()
                        .id(h.getId())
                        .citaId(h.getCita().getId())
                        .estadoAnterior(h.getEstadoAnterior())
                        .estadoNuevo(h.getEstadoNuevo())
                        .usuarioId(h.getUsuarioReferencia().getId())
                        .usuarioNombre(h.getUsuarioReferencia().getNombreMostrar())
                        .motivo(h.getMotivo())
                        .fechaCambio(h.getFechaCambio())
                        .build())
                .toList();
    }

    private CitaResponseDTO mapToDTO(Cita cita) {
        return CitaResponseDTO.builder()
                .id(cita.getId())
                .pacienteId(cita.getPaciente().getId())
                .pacienteNombreCompleto(cita.getPaciente().getNombres() + " " + cita.getPaciente().getApellidos())
                .pacienteDpi(cita.getPaciente().getDpi())
                .pacienteExpediente(cita.getPaciente().getNumeroExpediente())
                .cupoDiarioId(cita.getCupoDiario().getId())
                .fechaCita(cita.getCupoDiario().getFecha())
                .clinicaNombre(cita.getCupoDiario().getMedicoClinica().getClinica().getNombre())
                .medicoNombre(cita.getCupoDiario().getMedicoClinica().getMedico().getNombres())
                .horaEstimada(cita.getHoraEstimada())
                .horaVentanaInicio(cita.getHoraVentanaInicio())
                .horaVentanaFin(cita.getHoraVentanaFin())
                .estado(cita.getEstado())
                .citaOrigenId(cita.getCitaOrigen() != null ? cita.getCitaOrigen().getId() : null)
                .version(cita.getVersion())
                .creadoEn(cita.getCreadoEn())
                .actualizadoEn(cita.getActualizadoEn())
                .build();
    }
}
