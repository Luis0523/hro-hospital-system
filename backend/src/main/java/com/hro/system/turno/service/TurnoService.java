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
    private final HroAgendaProperties agendaProperties;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Check-in de enfermería: confirma llegada física del paciente y genera correlativo atómico diario.
     * Compatible con citas electrónicas y citas migradas en papel sin hora_estimada calculada.
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

        Long clinicaId = cita.getCupoDiario().getMedicoClinica().getClinica().getId();
        LocalDate fechaHoy = cita.getCupoDiario().getFecha();

        // Obtener número correlativo de forma atómica e indivisible en PostgreSQL
        Integer numeroTurno = turnoRepository.obtenerSiguienteTurnoAtomico(clinicaId, fechaHoy);

        Turno turno = Turno.builder()
                .cita(cita)
                .numeroTurno(numeroTurno)
                .estado("en_espera")
                .intentosLlamado(0)
                .horaGenerado(OffsetDateTime.now())
                .build();

        Turno guardado = turnoRepository.save(turno);

        // Actualizar estado de la cita a 'confirmada' en sala y registrar auditoría obligatoria
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

        // Actualizar tablero de sala
        notificarActualizacionTablero(clinicaId, fechaHoy);

        // Bitácora general
        publicarAuditoria("turno", guardado.getId(), "crear", usuario.getId(), null, Map.of(
                "numeroTurno", numeroTurno,
                "citaId", cita.getId(),
                "estado", "en_espera"
        ));

        log.info("Turno #{} generado para cita ID: {}, clínica ID: {}", numeroTurno, cita.getId(), clinicaId);
        return mapToDTO(guardado);
    }

    /**
     * Llamar paciente a consultorio: pasa el turno a 'llamado', incrementa intentos y actualiza el turno actual en el tablero.
     */
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

        Long clinicaId = turno.getCita().getCupoDiario().getMedicoClinica().getClinica().getId();
        LocalDate fecha = turno.getCita().getCupoDiario().getFecha();

        // Actualizar turno_actual en contador_turno_diario para que las pantallas muestren este número
        actualizarTurnoActualContador(clinicaId, fecha, turno.getNumeroTurno());

        notificarActualizacionTablero(clinicaId, fecha);

        publicarAuditoria("turno", actualizado.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "llamado", "intentosLlamado", actualizado.getIntentosLlamado(),
                        "tiempoGraciaSegundos", agendaProperties.getTurnos().getTiempoGraciaLlamadoSegundos()));

        log.info("Turno #{} llamado a consultorio (intento {}/{})",
                turno.getNumeroTurno(), actualizado.getIntentosLlamado(), agendaProperties.getTurnos().getMaxReintentosLlamado());

        return mapToDTO(actualizado);
    }

    /**
     * Marca un turno como 'no_responde' si expira el tiempo de gracia o no atiende al llamado.
     * Permite avanzar la fila inmediatamente sin bloquear la ventanilla/médico.
     */
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

        Long clinicaId = turno.getCita().getCupoDiario().getMedicoClinica().getClinica().getId();
        LocalDate fecha = turno.getCita().getCupoDiario().getFecha();

        notificarActualizacionTablero(clinicaId, fecha);

        publicarAuditoria("turno", actualizado.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "no_responde", "motivo", motivo != null ? motivo : "No se presentó tras llamado"));

        log.warn("Turno #{} marcado como 'no_responde' en clínica ID: {}", turno.getNumeroTurno(), clinicaId);
        return mapToDTO(actualizado);
    }

    /**
     * Reintegra un paciente en estado 'no_responde' el mismo día.
     * Conserva la misma cita y turno, asignándole una nueva posición al final de la fila actual con fn_siguiente_turno.
     */
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

        Long clinicaId = turno.getCita().getCupoDiario().getMedicoClinica().getClinica().getId();
        LocalDate fecha = turno.getCita().getCupoDiario().getFecha();

        int turnoAnterior = turno.getNumeroTurno();

        // Obtener nueva posición al final de la fila actual del día
        Integer nuevoNumeroTurno = turnoRepository.obtenerSiguienteTurnoAtomico(clinicaId, fecha);

        turno.setNumeroTurno(nuevoNumeroTurno);
        turno.setEstado("reintegrado");
        turno.setIntentosLlamado(0);
        turno.setHoraLlamado(null);

        Turno actualizado = turnoRepository.save(turno);

        // Notificar al tablero
        notificarActualizacionTablero(clinicaId, fecha);

        // Auditoría inmutable en cita_estado_historial
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

    /**
     * Marca un turno como 'atendido' por el médico.
     * Actualiza la cita a estado 'atendida' y registra la auditoría correspondiente.
     */
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

        // Actualizar cita
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

        Long clinicaId = cita.getCupoDiario().getMedicoClinica().getClinica().getId();
        LocalDate fecha = cita.getCupoDiario().getFecha();
        notificarActualizacionTablero(clinicaId, fecha);

        publicarAuditoria("turno", actualizado.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "atendido"));

        return mapToDTO(actualizado);
    }

    /**
     * Cierre diario de turnos: Marca citas asociadas a turnos que quedaron en 'no_responde' como 'no_asistio'.
     * NO libera cupo en cupo_diario.
     */
    @Transactional
    public int procesarCierreDiarioTurnosNoRespondidos(LocalDate fecha, Long clinicaId, Long usuarioId) {
        Long usuarioResueltoId = UsuarioContexto.resolverId(usuarioId);
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        List<Turno> turnosNoResponde = turnoRepository.buscarNoRespondeParaCierre(fecha, clinicaId);
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
    public List<TurnoResponseDTO> listarTurnosEnEspera(Long clinicaId, LocalDate fecha) {
        LocalDate f = (fecha != null) ? fecha : LocalDate.now();
        return turnoRepository.buscarTurnosEnEsperaPorClinica(f, clinicaId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TurnoResponseDTO> listarTurnosActivos() {
        return turnoRepository.findByEstado("en_espera").stream()
                .map(this::mapToDTO)
                .toList();
    }

    private void actualizarTurnoActualContador(Long clinicaId, LocalDate fecha, Integer numeroTurno) {
        contadorRepository.findByClinicaIdAndFecha(clinicaId, fecha).ifPresent(contador -> {
            contador.setTurnoActual(numeroTurno);
            contadorRepository.save(contador);
        });
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

            messagingTemplate.convertAndSend("/topic/tablero", tablero);
            messagingTemplate.convertAndSend("/topic/clinica/" + clinicaId, tablero);
            log.debug("Evento WebSocket emitido al tablero para clinica ID: {}", clinicaId);
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
