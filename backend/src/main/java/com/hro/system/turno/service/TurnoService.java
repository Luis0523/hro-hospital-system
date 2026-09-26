package com.hro.system.turno.service;

import com.hro.system.agenda.config.HroAgendaProperties;
import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.entity.CitaEstadoHistorial;
import com.hro.system.cita.repository.CitaEstadoHistorialRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.turno.dto.GenerarTurnoRequestDTO;
import com.hro.system.turno.dto.ReintegrarTurnoRequestDTO;
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
    private final CitaEstadoHistorialRepository historialRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final AsignacionDiariaEspacioRepository asignacionRepository;
    private final HroAgendaProperties agendaProperties;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Check-in: confirma llegada física, resuelve la sala del día (asignación diaria por
     * subespecialidad) y genera el correlativo atómico con fn_siguiente_turno.
     */
    @Transactional
    public TurnoResponseDTO generarTurnoParaCita(GenerarTurnoRequestDTO dto) {
        Cita cita = citaRepository.findById(dto.getCitaId())
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", dto.getCitaId()));

        Long usuarioResueltoId = UsuarioContexto.resolverId(dto.getUsuarioId());
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        if ("cancelada".equalsIgnoreCase(cita.getEstado()) || "reprogramada".equalsIgnoreCase(cita.getEstado())) {
            throw new BusinessException(String.format("No se puede generar turno para una cita en estado '%s'", cita.getEstado()));
        }

        if (turnoRepository.findByCitaId(cita.getId()).isPresent()) {
            throw new BusinessException("La cita ya cuenta con un turno generado previamente.");
        }

        LocalDate fecha = cita.getCupoDiario().getFecha();
        Long subespecialidadId = cita.getCupoDiario().getMedicoSubespecialidad().getSubespecialidad().getId();

        AsignacionDiariaEspacio asignacion = asignacionRepository
                .findBySubespecialidadIdAndFecha(subespecialidadId, fecha)
                .orElseThrow(() -> new BusinessException(
                        "No hay un espacio físico asignado para la subespecialidad "
                                + cita.getCupoDiario().getMedicoSubespecialidad().getSubespecialidad().getNombre()
                                + " el " + fecha + ". El jefe de enfermería debe asignar la sala del día."));

        Integer numeroTurno = turnoRepository.obtenerSiguienteTurnoAtomico(asignacion.getId());

        Turno turno = Turno.builder()
                .cita(cita)
                .asignacionDiariaEspacio(asignacion)
                .numeroTurno(numeroTurno)
                .estado("en_espera")
                .intentosLlamado(0)
                .horaGenerado(OffsetDateTime.now())
                .build();

        Turno guardado = turnoRepository.save(turno);

        String estadoAnterior = cita.getEstado();
        cita.setEstado("confirmada");
        cita.setActualizadoEn(OffsetDateTime.now());
        citaRepository.save(cita);

        historialRepository.save(CitaEstadoHistorial.builder()
                .cita(cita)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo("confirmada")
                .usuarioReferencia(usuario)
                .motivo("Check-in presencial en enfermería. Asignado turno #" + numeroTurno)
                .fechaCambio(OffsetDateTime.now())
                .build());

        notificarActualizacionTablero(asignacion.getId(), "ACTUALIZACION", null);

        publicarAuditoria("turno", guardado.getId(), "crear", usuario.getId(), null, Map.of(
                "numeroTurno", numeroTurno,
                "citaId", cita.getId(),
                "asignacionDiariaEspacioId", asignacion.getId(),
                "estado", "en_espera"
        ));

        log.info("Turno #{} generado para cita ID: {}, asignación diaria ID: {}", numeroTurno, cita.getId(), asignacion.getId());
        return mapToDTO(guardado);
    }

    @Transactional
    public TurnoResponseDTO llamarTurno(Long turnoId, Long usuarioId) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Turno", "id", turnoId));

        Long usuarioResueltoId = UsuarioContexto.resolverId(usuarioId);
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        String estadoAnterior = turno.getEstado();
        turno.setEstado("llamado");
        turno.setHoraLlamado(OffsetDateTime.now());
        turno.setIntentosLlamado(turno.getIntentosLlamado() + 1);

        Turno actualizado = turnoRepository.save(turno);

        Long asignacionId = turno.getAsignacionDiariaEspacio() != null ? turno.getAsignacionDiariaEspacio().getId() : null;
        actualizarTurnoActualContador(asignacionId, turno.getNumeroTurno());
        notificarActualizacionTablero(asignacionId, "LLAMADO", actualizado.getIntentosLlamado());

        publicarAuditoria("turno", actualizado.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "llamado", "intentosLlamado", actualizado.getIntentosLlamado(),
                        "tiempoGraciaSegundos", agendaProperties.getTurnos().getTiempoGraciaLlamadoSegundos()));

        log.info("Turno #{} llamado a consultorio (intento {}/{})",
                turno.getNumeroTurno(), actualizado.getIntentosLlamado(), agendaProperties.getTurnos().getMaxReintentosLlamado());

        return mapToDTO(actualizado);
    }

    @Transactional
    public TurnoResponseDTO marcarNoResponde(Long turnoId, Long usuarioId, String motivo) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Turno", "id", turnoId));

        Long usuarioResueltoId = UsuarioContexto.resolverId(usuarioId);
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        String estadoAnterior = turno.getEstado();
        turno.setEstado("no_responde");
        Turno actualizado = turnoRepository.save(turno);

        Long asignacionId = turno.getAsignacionDiariaEspacio() != null ? turno.getAsignacionDiariaEspacio().getId() : null;
        notificarActualizacionTablero(asignacionId, "ACTUALIZACION", null);

        publicarAuditoria("turno", actualizado.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "no_responde", "motivo", motivo != null ? motivo : "No se presentó tras llamado"));

        log.warn("Turno #{} marcado como 'no_responde'", turno.getNumeroTurno());
        return mapToDTO(actualizado);
    }

    @Transactional
    public TurnoResponseDTO reintegrarTurno(Long turnoId, ReintegrarTurnoRequestDTO dto) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Turno", "id", turnoId));

        Long usuarioResueltoId = UsuarioContexto.resolverId(dto.getUsuarioId());
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        if (!"no_responde".equalsIgnoreCase(turno.getEstado())) {
            throw new BusinessException(String.format("Solo se pueden reintegrar turnos en estado 'no_responde'. Estado actual: '%s'", turno.getEstado()));
        }

        Long asignacionId = turno.getAsignacionDiariaEspacio() != null ? turno.getAsignacionDiariaEspacio().getId() : null;
        if (asignacionId == null) {
            throw new BusinessException("El turno no tiene una asignación diaria asociada; no se puede reintegrar.");
        }

        int turnoAnterior = turno.getNumeroTurno();
        Integer nuevoNumeroTurno = turnoRepository.obtenerSiguienteTurnoAtomico(asignacionId);

        turno.setNumeroTurno(nuevoNumeroTurno);
        turno.setEstado("reintegrado");
        turno.setIntentosLlamado(0);
        turno.setHoraLlamado(null);

        Turno actualizado = turnoRepository.save(turno);
        notificarActualizacionTablero(asignacionId, "ACTUALIZACION", null);

        historialRepository.save(CitaEstadoHistorial.builder()
                .cita(turno.getCita())
                .estadoAnterior("confirmada")
                .estadoNuevo("confirmada")
                .usuarioReferencia(usuario)
                .motivo(String.format("Reintegración a la fila. Turno anterior: #%d, nuevo turno: #%d. Observaciones: %s",
                        turnoAnterior, nuevoNumeroTurno, dto.getMotivo() != null ? dto.getMotivo() : "Paciente presente en sala"))
                .fechaCambio(OffsetDateTime.now())
                .build());

        publicarAuditoria("turno", actualizado.getId(), "actualizar", usuario.getId(),
                Map.of("numeroTurnoAnterior", turnoAnterior),
                Map.of("nuevoNumeroTurno", nuevoNumeroTurno, "estado", "reintegrado"));

        log.info("Turno ID {} reintegrado a la fila: antes #{} -> ahora #{}", turnoId, turnoAnterior, nuevoNumeroTurno);
        return mapToDTO(actualizado);
    }

    @Transactional
    public TurnoResponseDTO marcarAtendido(Long turnoId, Long usuarioId) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Turno", "id", turnoId));

        Long usuarioResueltoId = UsuarioContexto.resolverId(usuarioId);
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        String estadoAnterior = turno.getEstado();
        turno.setEstado("atendido");
        turno.setHoraAtendido(OffsetDateTime.now());
        Turno actualizado = turnoRepository.save(turno);

        Cita cita = turno.getCita();
        String estadoCitaAnterior = cita.getEstado();
        cita.setEstado("atendida");
        cita.setActualizadoEn(OffsetDateTime.now());
        citaRepository.save(cita);

        historialRepository.save(CitaEstadoHistorial.builder()
                .cita(cita)
                .estadoAnterior(estadoCitaAnterior)
                .estadoNuevo("atendida")
                .usuarioReferencia(usuario)
                .motivo("Consulta médica concluida exitosamente")
                .fechaCambio(OffsetDateTime.now())
                .build());

        Long asignacionId = turno.getAsignacionDiariaEspacio() != null ? turno.getAsignacionDiariaEspacio().getId() : null;
        notificarActualizacionTablero(asignacionId, "ACTUALIZACION", null);

        publicarAuditoria("turno", actualizado.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "atendido"));

        return mapToDTO(actualizado);
    }

    @Transactional
    public int procesarCierreDiarioTurnosNoRespondidos(LocalDate fecha, Long subespecialidadId, Long usuarioId) {
        Long usuarioResueltoId = UsuarioContexto.resolverId(usuarioId);
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        List<Turno> turnosNoResponde = turnoRepository.buscarNoRespondeParaCierre(fecha, subespecialidadId);
        int total = 0;

        for (Turno t : turnosNoResponde) {
            Cita cita = t.getCita();
            if (!"atendida".equalsIgnoreCase(cita.getEstado()) && !"no_asistio".equalsIgnoreCase(cita.getEstado())) {
                String estadoAnterior = cita.getEstado();
                cita.setEstado("no_asistio");
                cita.setActualizadoEn(OffsetDateTime.now());
                citaRepository.save(cita);

                historialRepository.save(CitaEstadoHistorial.builder()
                        .cita(cita)
                        .estadoAnterior(estadoAnterior)
                        .estadoNuevo("no_asistio")
                        .usuarioReferencia(usuario)
                        .motivo("Inasistencia al cierre de jornada: Turno #" + t.getNumeroTurno() + " no respondió a los llamados.")
                        .fechaCambio(OffsetDateTime.now())
                        .build());
                total++;
            }
        }

        log.info("Cierre de turnos completado para fecha {}. {} turnos no respondidos marcados como 'no_asistio'.", fecha, total);
        return total;
    }

    @Transactional(readOnly = true)
    public List<TurnoResponseDTO> listarTurnosEnEspera(Long asignacionId) {
        return turnoRepository.buscarTurnosEnEsperaPorAsignacion(asignacionId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TurnoResponseDTO> listarTurnosActivos() {
        return turnoRepository.findByEstado("en_espera").stream()
                .map(this::mapToDTO)
                .toList();
    }

    private void actualizarTurnoActualContador(Long asignacionId, Integer numeroTurno) {
        if (asignacionId == null) {
            return;
        }
        contadorRepository.findByAsignacionDiariaEspacioId(asignacionId).ifPresent(contador -> {
            contador.setTurnoActual(numeroTurno);
            contadorRepository.save(contador);
        });
    }

    private void notificarActualizacionTablero(Long asignacionId, String tipoEvento, Integer intentosLlamado) {
        if (asignacionId == null) {
            return;
        }
        contadorRepository.findByAsignacionDiariaEspacioId(asignacionId).ifPresent(contador -> {
            AsignacionDiariaEspacio a = contador.getAsignacionDiariaEspacio();
            TableroTurnoDTO tablero = TableroTurnoDTO.builder()
                    .asignacionDiariaEspacioId(a.getId())
                    .espacioNumero(a.getEspacioFisico().getNumero())
                    .nivel(a.getEspacioFisico().getNivel())
                    .subespecialidadNombre(a.getSubespecialidad().getNombre())
                    .turnoActual(contador.getTurnoActual())
                    .turnoSiguiente(contador.getTurnoSiguiente())
                    .ultimaActualizacion(OffsetDateTime.now())
                    .intentosLlamado(intentosLlamado)
                    .tipoEvento(tipoEvento)
                    .build();

            messagingTemplate.convertAndSend("/topic/tablero", tablero);
            messagingTemplate.convertAndSend("/topic/clinica/" + a.getId(), tablero);
            log.debug("Evento WebSocket emitido al tablero para asignación diaria ID: {}", a.getId());
        });
    }

    private void publicarAuditoria(String tabla, Long id, String accion, Long usuarioId, Map<String, Object> ant, Map<String, Object> nue) {
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada(tabla)
                .entidadId(id)
                .accion(accion)
                .usuarioReferenciaId(usuarioId)
                .valoresAnteriores(ant)
                .valoresNuevos(nue)
                .build());
    }

    private TurnoResponseDTO mapToDTO(Turno turno) {
        AsignacionDiariaEspacio a = turno.getAsignacionDiariaEspacio();
        return TurnoResponseDTO.builder()
                .id(turno.getId())
                .citaId(turno.getCita().getId())
                .numeroTurno(turno.getNumeroTurno())
                .estado(turno.getEstado())
                .intentosLlamado(turno.getIntentosLlamado())
                .asignacionDiariaEspacioId(a != null ? a.getId() : null)
                .espacioNumero(a != null ? a.getEspacioFisico().getNumero() : null)
                .nivel(a != null ? a.getEspacioFisico().getNivel() : null)
                .subespecialidadId(a != null ? a.getSubespecialidad().getId() : null)
                .subespecialidadNombre(a != null ? a.getSubespecialidad().getNombre() : null)
                .medicoNombre(turno.getCita().getCupoDiario().getMedicoSubespecialidad().getMedico().getNombres())
                .horaGenerado(turno.getHoraGenerado())
                .horaLlamado(turno.getHoraLlamado())
                .horaAtendido(turno.getHoraAtendido())
                .build();
    }
}
