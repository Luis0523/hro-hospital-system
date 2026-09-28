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
import com.hro.system.estacion.context.EstacionContexto;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.estacion.repository.EstacionSubespecialidadRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    private final EstacionEnfermeriaRepository estacionRepository;
    private final EstacionSubespecialidadRepository estacionSubespecialidadRepository;
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
        Long subespecialidadId = cita.getCupoDiario().getSubespecialidadHorario().getSubespecialidad().getId();

        // Si la consola envió X-Estacion-Id, la subespecialidad de la cita debe pertenecer a esa estación.
        EstacionContexto.idActual().ifPresent(estacionId -> {
            boolean pertenece = estacionSubespecialidadRepository.findBySubespecialidadId(subespecialidadId)
                    .map(es -> es.getEstacion().getId().equals(estacionId))
                    .orElse(false);
            if (!pertenece) {
                throw new BusinessException(
                        "La subespecialidad de la cita no pertenece a la estación seleccionada.");
            }
        });

        List<AsignacionDiariaEspacio> salas = asignacionRepository.findBySubespecialidadIdAndFecha(subespecialidadId, fecha);
        if (salas.isEmpty()) {
            throw new BusinessException(
                    "No hay un espacio físico asignado para la subespecialidad "
                            + cita.getCupoDiario().getSubespecialidadHorario().getSubespecialidad().getNombre()
                            + " el " + fecha + ". El jefe de enfermería debe asignar la sala del día.");
        }
        AsignacionDiariaEspacio asignacion = elegirSalaMenosCargada(salas);

        Integer numeroTurno = turnoRepository.obtenerSiguienteTurnoGlobal(fecha);

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
        return llamarTurno(turnoId, usuarioId, false);
    }

    @Transactional
    public TurnoResponseDTO llamarTurno(Long turnoId, Long usuarioId, boolean porNombre) {
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
        notificarActualizacionTablero(asignacionId, "LLAMADO", actualizado.getIntentosLlamado(), porNombre);

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
        Integer nuevoNumeroTurno = turnoRepository.obtenerSiguienteTurnoGlobal(
                turno.getAsignacionDiariaEspacio().getFecha());

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

    /**
     * "Pasar siguiente": toma el primer turno en espera de la sala (orden por correlativo) y lo llama.
     * La consulta toma un lock pesimista para que dos terminales no llamen al mismo turno a la vez.
     */
    @Transactional
    public TurnoResponseDTO avanzarSiguiente(Long asignacionId, Long usuarioId) {
        AsignacionDiariaEspacio asignacion = asignacionRepository.findById(asignacionId)
                .orElseThrow(() -> new ResourceNotFoundException("AsignacionDiariaEspacio", "id", asignacionId));

        Turno siguiente = turnoRepository
                .findFirstByAsignacionDiariaEspacioIdAndEstadoOrderByNumeroTurnoAsc(asignacion.getId(), "en_espera")
                .orElseThrow(() -> new BusinessException(
                        "No hay turnos en espera para la sala " + asignacion.getEspacioFisico().getNumero()
                                + " (" + asignacion.getSubespecialidad().getNombre() + ")."));

        return llamarTurno(siguiente.getId(), usuarioId);
    }

    /**
     * Estado actual del tablero de una sala, sin esperar WebSocket (carga inicial de la TV).
     */
    @Transactional(readOnly = true)
    public TableroTurnoDTO obtenerEstadoTablero(Long asignacionId) {
        AsignacionDiariaEspacio asignacion = asignacionRepository.findById(asignacionId)
                .orElseThrow(() -> new ResourceNotFoundException("AsignacionDiariaEspacio", "id", asignacionId));
        ContadorTurnoDiario contador = contadorRepository.findByAsignacionDiariaEspacioId(asignacionId).orElse(null);
        return construirTablero(asignacion, "ACTUALIZACION", null, contador);
    }

    /**
     * Estado del tablero de una estación para la fecha: todas las salas del día cuyas
     * subespecialidades pertenecen a la estación.
     */
    @Transactional(readOnly = true)
    public List<TableroTurnoDTO> obtenerTableroEstacion(Long estacionId, LocalDate fecha) {
        LocalDate f = (fecha != null) ? fecha : LocalDate.now();
        return asignacionesDeEstacion(estacionId, f).stream()
                .map(a -> construirTablero(a, "ACTUALIZACION", null,
                        contadorRepository.findByAsignacionDiariaEspacioId(a.getId()).orElse(null)))
                .toList();
    }

    /**
     * Cola de turnos de todas las salas de la estación. Por defecto incluye solo los activos
     * (en espera/llamado/reintegrado); con {@code incluirNoResponde} agrega los no respondidos.
     */
    @Transactional(readOnly = true)
    public List<TurnoResponseDTO> listarTurnosEstacion(Long estacionId, LocalDate fecha, boolean incluirNoResponde) {
        LocalDate f = (fecha != null) ? fecha : LocalDate.now();
        List<Turno> turnos = new ArrayList<>();
        for (AsignacionDiariaEspacio asignacion : asignacionesDeEstacion(estacionId, f)) {
            turnos.addAll(turnoRepository.buscarTurnosEnEsperaPorAsignacion(asignacion.getId()));
            if (incluirNoResponde) {
                turnos.addAll(turnoRepository.buscarNoRespondePorAsignacion(asignacion.getId()));
            }
        }
        return turnos.stream()
                .sorted(Comparator.comparing(Turno::getNumeroTurno))
                .map(this::mapToDTO)
                .toList();
    }

    /** Asignaciones del día cuyas subespecialidades pertenecen a la estación (orden por sala). */
    private List<AsignacionDiariaEspacio> asignacionesDeEstacion(Long estacionId, LocalDate fecha) {
        EstacionEnfermeria estacion = estacionRepository.findById(estacionId)
                .orElseThrow(() -> new ResourceNotFoundException("EstacionEnfermeria", "id", estacionId));
        List<Long> subespecialidadIds = estacionSubespecialidadRepository
                .findByEstacionIdAndActivoTrue(estacion.getId()).stream()
                .map(es -> es.getSubespecialidad().getId())
                .toList();
        if (subespecialidadIds.isEmpty()) {
            return List.of();
        }
        return asignacionRepository.findByFechaAndSubespecialidadIdIn(fecha, subespecialidadIds).stream()
                .sorted(Comparator.comparing((AsignacionDiariaEspacio a) -> a.getEspacioFisico().getNumero()))
                .toList();
    }

    /**
     * Balanceo: elige la sala de la subespecialidad con menos turnos en espera.
     */
    private AsignacionDiariaEspacio elegirSalaMenosCargada(List<AsignacionDiariaEspacio> salas) {
        AsignacionDiariaEspacio elegida = null;
        long menor = Long.MAX_VALUE;
        for (AsignacionDiariaEspacio sala : salas) {
            long pendientes = turnoRepository.countByAsignacionDiariaEspacioIdAndEstado(sala.getId(), "en_espera");
            if (pendientes < menor) {
                menor = pendientes;
                elegida = sala;
            }
        }
        return elegida;
    }

    /**
     * Reasigna un turno a otra sala de la misma subespecialidad (p. ej. si una sala se desocupa antes).
     */
    @Transactional
    public TurnoResponseDTO reasignarSala(Long turnoId, UUID nuevoEspacioFisicoId, String motivo) {
        Turno turno = turnoRepository.findById(turnoId)
                .orElseThrow(() -> new ResourceNotFoundException("Turno", "id", turnoId));
        AsignacionDiariaEspacio actual = turno.getAsignacionDiariaEspacio();
        if (actual == null) {
            throw new BusinessException("El turno no tiene una sala asignada; no se puede reasignar.");
        }
        AsignacionDiariaEspacio nueva = asignacionRepository.findByEspacioFisicoIdAndFecha(nuevoEspacioFisicoId, actual.getFecha())
                .orElseThrow(() -> new ResourceNotFoundException("AsignacionDiariaEspacio", "espacioFisicoId", nuevoEspacioFisicoId));
        if (!nueva.getSubespecialidad().getId().equals(actual.getSubespecialidad().getId())) {
            throw new BusinessException("La sala destino no atiende la misma subespecialidad del turno.");
        }

        turno.setAsignacionDiariaEspacio(nueva);
        Turno guardado = turnoRepository.save(turno);

        publicarAuditoria("turno", guardado.getId(), "actualizar", UsuarioContexto.resolverId(null),
                Map.of("asignacionDiariaEspacioId", actual.getId()),
                Map.of("asignacionDiariaEspacioId", nueva.getId(), "motivo", motivo != null ? motivo : "Reasignación de sala"));

        notificarActualizacionTablero(actual.getId(), "ACTUALIZACION", null);
        notificarActualizacionTablero(nueva.getId(), "ACTUALIZACION", null);
        log.info("Turno #{} reasignado de la sala {} a la sala {}", guardado.getNumeroTurno(), actual.getId(), nueva.getId());
        return mapToDTO(guardado);
    }

    private void actualizarTurnoActualContador(Long asignacionId, Integer numeroTurno) {
        if (asignacionId == null) {
            return;
        }
        AsignacionDiariaEspacio a = asignacionRepository.findById(asignacionId).orElse(null);
        if (a == null) {
            return;
        }
        ContadorTurnoDiario contador = obtenerOCrearContador(a);
        contador.setTurnoActual(numeroTurno);
        contador.setTurnoSiguiente(Math.max(contador.getTurnoSiguiente(), numeroTurno + 1));
        contadorRepository.save(contador);
    }

    /**
     * Recupera el contador de la asignación; si aún no existe (primer evento del día),
     * lo crea y persiste para que el tablero nunca reciba contadores nulos.
     */
    private ContadorTurnoDiario obtenerOCrearContador(AsignacionDiariaEspacio asignacion) {
        return contadorRepository.findByAsignacionDiariaEspacioId(asignacion.getId())
                .orElseGet(() -> contadorRepository.save(ContadorTurnoDiario.builder()
                        .asignacionDiariaEspacio(asignacion)
                        .turnoActual(0)
                        .turnoSiguiente(1)
                        .build()));
    }

    private void notificarActualizacionTablero(Long asignacionId, String tipoEvento, Integer intentosLlamado) {
        notificarActualizacionTablero(asignacionId, tipoEvento, intentosLlamado, false);
    }

    private void notificarActualizacionTablero(Long asignacionId, String tipoEvento,
                                               Integer intentosLlamado, boolean porNombre) {
        if (asignacionId == null) {
            return;
        }
        AsignacionDiariaEspacio a = asignacionRepository.findById(asignacionId).orElse(null);
        if (a == null) {
            return;
        }
        TableroTurnoDTO tablero = construirTablero(a, tipoEvento, intentosLlamado,
                obtenerOCrearContador(a), porNombre);
        messagingTemplate.convertAndSend("/topic/tablero", tablero);
        messagingTemplate.convertAndSend("/topic/clinica/" + a.getId(), tablero);
        estacionSubespecialidadRepository.findBySubespecialidadId(a.getSubespecialidad().getId())
                .ifPresent(es -> messagingTemplate.convertAndSend(
                        "/topic/estacion/" + es.getEstacion().getId(), tablero));
        log.debug("Evento WebSocket emitido al tablero para asignación diaria ID: {}", a.getId());
    }

    private TableroTurnoDTO construirTablero(AsignacionDiariaEspacio a, String tipoEvento,
                                             Integer intentosLlamado, ContadorTurnoDiario contador) {
        return construirTablero(a, tipoEvento, intentosLlamado, contador, false);
    }

    private TableroTurnoDTO construirTablero(AsignacionDiariaEspacio a, String tipoEvento,
                                             Integer intentosLlamado, ContadorTurnoDiario contador,
                                             boolean porNombre) {
        String pacienteActual = turnoRepository
                .findFirstByAsignacionDiariaEspacioIdAndEstadoOrderByNumeroTurnoDesc(a.getId(), "llamado")
                .map(this::nombrePaciente)
                .orElse(null);
        List<Integer> enEspera = turnoRepository.buscarTurnosEnEsperaPorAsignacion(a.getId()).stream()
                .filter(t -> "en_espera".equals(t.getEstado()) || "reintegrado".equals(t.getEstado()))
                .map(Turno::getNumeroTurno)
                .toList();
        return TableroTurnoDTO.builder()
                .asignacionDiariaEspacioId(a.getId())
                .espacioNumero(a.getEspacioFisico().getNumero())
                .nivel(a.getEspacioFisico().getNivel())
                .subespecialidadNombre(a.getSubespecialidad().getNombre())
                .subespecialidadId(a.getSubespecialidad().getId())
                .especialidadId(a.getSubespecialidad().getEspecialidad() != null
                        ? a.getSubespecialidad().getEspecialidad().getId() : null)
                .turnoActual(contador != null ? contador.getTurnoActual() : null)
                .turnoSiguiente(contador != null ? contador.getTurnoSiguiente() : null)
                .ultimaActualizacion(OffsetDateTime.now())
                .intentosLlamado(intentosLlamado)
                .tipoEvento(tipoEvento)
                .pacienteNombre(pacienteActual)
                .turnosEnEspera(enEspera)
                .porNombre(porNombre)
                .build();
    }

    private String nombrePaciente(Turno turno) {
        if (turno == null || turno.getCita() == null || turno.getCita().getPaciente() == null) {
            return null;
        }
        var paciente = turno.getCita().getPaciente();
        String nombre = ((paciente.getNombres() != null ? paciente.getNombres() : "") + " "
                + (paciente.getApellidos() != null ? paciente.getApellidos() : "")).trim();
        return nombre.isEmpty() ? null : nombre;
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
                .pacienteNombre(nombrePaciente(turno))
                .pacienteExpediente(turno.getCita() != null && turno.getCita().getPaciente() != null
                        ? turno.getCita().getPaciente().getNumeroExpediente() : null)
                .horaGenerado(turno.getHoraGenerado())
                .horaLlamado(turno.getHoraLlamado())
                .horaAtendido(turno.getHoraAtendido())
                .build();
    }
}
