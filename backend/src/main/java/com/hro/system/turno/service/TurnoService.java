package com.hro.system.turno.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.turno.dto.GenerarTurnoRequestDTO;
import com.hro.system.turno.dto.TableroTurnoDTO;
import com.hro.system.turno.dto.TurnoResponseDTO;
import com.hro.system.turno.entity.ContadorTurnoDiario;
import com.hro.system.turno.entity.Turno;
import com.hro.system.turno.repository.ContadorTurnoDiarioRepository;
import com.hro.system.turno.repository.TurnoRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TurnoService {

    private final TurnoRepository turnoRepository;
    private final ContadorTurnoDiarioRepository contadorRepository;
    private final CitaRepository citaRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public TurnoResponseDTO generarTurnoParaCita(GenerarTurnoRequestDTO dto) {
        Cita cita = citaRepository.findById(dto.getCitaId())
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", dto.getCitaId()));

        UsuarioReferencia usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", dto.getUsuarioId()));

        if (turnoRepository.findByCitaId(cita.getId()).isPresent()) {
            throw new BusinessException("La cita ya cuenta con un turno generado previamente");
        }

        Long clinicaId = cita.getCupoDiario().getMedicoClinica().getClinica().getId();
        LocalDate fechaHoy = cita.getCupoDiario().getFecha();

        // Asignación atómica en PostgreSQL que evita duplicados de turno sin condiciones de carrera
        Integer numeroTurno = turnoRepository.obtenerSiguienteTurnoAtomico(clinicaId, fechaHoy);

        Turno turno = Turno.builder()
                .cita(cita)
                .numeroTurno(numeroTurno)
                .estado("en_espera")
                .intentosLlamado(0)
                .horaGenerado(OffsetDateTime.now())
                .build();

        Turno guardado = turnoRepository.save(turno);

        // Actualizar estado de la cita a confirmada en sala
        cita.setEstado("confirmada");
        citaRepository.save(cita);

        // Notificación en tiempo real a enfermería
        notificarActualizacionTablero(clinicaId, fechaHoy);

        // Auditoría
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("turno")
                .entidadId(guardado.getId())
                .accion("crear")
                .usuarioReferenciaId(usuario.getId())
                .valoresAnteriores(null)
                .valoresNuevos(Map.of(
                        "numeroTurno", numeroTurno,
                        "citaId", cita.getId(),
                        "estado", "en_espera"
                ))
                .build());

        log.info("Turno #{} generado para cita ID: {}, clínica ID: {}", numeroTurno, cita.getId(), clinicaId);
        return mapToDTO(guardado);
    }

    @Transactional
    public TurnoResponseDTO avanzarTurno(Long turnoId, String nuevoEstado, Long usuarioId) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Turno", "id", turnoId));

        String estadoAnterior = turno.getEstado();
        turno.setEstado(nuevoEstado);

        if ("llamado".equalsIgnoreCase(nuevoEstado)) {
            turno.setHoraLlamado(OffsetDateTime.now());
            turno.setIntentosLlamado(turno.getIntentosLlamado() + 1);
        } else if ("atendido".equalsIgnoreCase(nuevoEstado)) {
            turno.setHoraAtendido(OffsetDateTime.now());
            turno.getCita().setEstado("atendida");
            citaRepository.save(turno.getCita());
        }

        Turno actualizado = turnoRepository.save(turno);

        Long clinicaId = turno.getCita().getCupoDiario().getMedicoClinica().getClinica().getId();
        LocalDate fecha = turno.getCita().getCupoDiario().getFecha();

        // Notificación a pantallas de sala de espera en tiempo real
        notificarActualizacionTablero(clinicaId, fecha);

        // Auditoría
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("turno")
                .entidadId(actualizado.getId())
                .accion("actualizar")
                .usuarioReferenciaId(usuarioId)
                .valoresAnteriores(Map.of("estado", estadoAnterior))
                .valoresNuevos(Map.of("estado", nuevoEstado, "intentosLlamado", actualizado.getIntentosLlamado()))
                .build());

        return mapToDTO(actualizado);
    }

    @Transactional(readOnly = true)
    public List<TurnoResponseDTO> listarTurnosActivos() {
        return turnoRepository.findByEstado("en_espera").stream()
                .map(this::mapToDTO)
                .toList();
    }

    private void notificarActualizacionTablero(Long clinicaId, LocalDate fecha) {
        contadorRepository.findByClinicaIdAndFecha(clinicaId, fecha).ifPresent(contador -> {
            TableroTurnoDTO tablero = TableroTurnoDTO.builder()
                    .clinicaId(clinicaId)
                    .clinicaNombre(contador.getClinica().getNombre())
                    .consultorioUbicacion(contador.getClinica().getUbicacion())
                    .turnoActual(contador.getTurnoActual())
                    .turnoSiguiente(contador.getTurnoSiguiente())
                    .ultimaActualizacion(OffsetDateTime.now())
                    .build();

            // Topic general de tablero de salas y topic específico de la clínica
            messagingTemplate.convertAndSend("/topic/tablero", tablero);
            messagingTemplate.convertAndSend("/topic/clinica/" + clinicaId, tablero);
            log.debug("Evento WebSocket emitido al tablero para clinica ID: {}", clinicaId);
        });
    }

    private TurnoResponseDTO mapToDTO(Turno turno) {
        return TurnoResponseDTO.builder()
                .id(turno.getId())
                .citaId(turno.getCita().getId())
                .numeroTurno(turno.getNumeroTurno())
                .estado(turno.getEstado())
                .intentosLlamado(turno.getIntentosLlamado())
                .clinicaId(turno.getCita().getCupoDiario().getMedicoClinica().getClinica().getId())
                .clinicaNombre(turno.getCita().getCupoDiario().getMedicoClinica().getClinica().getNombre())
                .medicoNombre(turno.getCita().getCupoDiario().getMedicoClinica().getMedico().getNombres())
                .horaGenerado(turno.getHoraGenerado())
                .horaLlamado(turno.getHoraLlamado())
                .horaAtendido(turno.getHoraAtendido())
                .build();
    }
}
