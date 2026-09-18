package com.hro.system.cita.service;

import com.hro.system.agenda.config.HroAgendaProperties;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.service.CupoDiarioService;
import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.cita.dto.*;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.entity.CitaEstadoHistorial;
import com.hro.system.cita.repository.CitaEstadoHistorialRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.medico.entity.MedicoSubespecialidad;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CitaService {

    private static final Set<String> ESTADOS_TERMINALES = Set.of("atendida", "cancelada", "reprogramada", "no_asistio");

    private final CitaRepository citaRepository;
    private final CitaEstadoHistorialRepository historialRepository;
    private final PacienteRepository pacienteRepository;
    private final CupoDiarioRepository cupoDiarioRepository;
    private final CupoDiarioService cupoDiarioService;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final HroAgendaProperties agendaProperties;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Agendamiento inicial de cita médica con reserva atómica de cupo y cálculo de ventana de tolerancia.
     */
    @Transactional
    public CitaResponseDTO agendarCita(CrearCitaRequestDTO dto) {
        Paciente paciente = pacienteRepository.findById(dto.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "id", dto.getPacienteId()));

        CupoDiario cupo = cupoDiarioRepository.findById(dto.getCupoDiarioId())
                .orElseThrow(() -> new ResourceNotFoundException("CupoDiario", "id", dto.getCupoDiarioId()));

        Long usuarioId = UsuarioContexto.resolverId(dto.getUsuarioId());
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));

        // Reserva atómica en PostgreSQL para prevenir sobreventa ante concurrencia
        cupoDiarioService.reservarCupoAtomico(cupo.getMedicoSubespecialidad().getId(), cupo.getFecha());

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

        // Calcular hora estimada y ventana si no fueron enviadas explícitamente (ej. motor de citas)
        calcularHoraYVentanaSiCorresponde(nuevaCita, cupo);

        Cita citaGuardada = citaRepository.save(nuevaCita);

        // Registro obligatorio de auditoría en el historial de estados
        registrarTransicionEstado(citaGuardada, null, "pendiente", usuario, "Agendamiento inicial de la cita");

        // Evento de auditoría general
        publicarAuditoriaGeneral(citaGuardada.getId(), "crear", usuario.getId(), null, Map.of(
                "pacienteId", paciente.getId(),
                "cupoDiarioId", cupo.getId(),
                "estado", "pendiente"
        ));

        log.info("Cita agendada exitosamente ID: {} para paciente DPI: {}", citaGuardada.getId(), paciente.getDpi());
        return mapToDTO(citaGuardada);
    }

    /**
     * Reprogramación de cita preservando la cita original (creando una nueva fila que referencia a cita_origen_id).
     * La cita original pasa al estado 'reprogramada' y libera su cupo anterior; la nueva cita reserva su cupo atómicamente.
     */
    @Transactional
    public CitaResponseDTO reprogramarCita(Long citaId, ReprogramarCitaRequestDTO dto) {
        Cita citaOriginal = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", citaId));

        if (ESTADOS_TERMINALES.contains(citaOriginal.getEstado())) {
            throw new BusinessException(String.format("No se puede reprogramar una cita con estado terminal: '%s'", citaOriginal.getEstado()));
        }

        CupoDiario nuevoCupo = cupoDiarioRepository.findById(dto.getNuevoCupoDiarioId())
                .orElseThrow(() -> new ResourceNotFoundException("CupoDiario", "id", dto.getNuevoCupoDiarioId()));

        Long usuarioId = UsuarioContexto.resolverId(dto.getUsuarioId());
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));

        // 1. Reservar de forma atómica el nuevo cupo
        cupoDiarioService.reservarCupoAtomico(nuevoCupo.getMedicoSubespecialidad().getId(), nuevoCupo.getFecha());

        // 2. Actualizar cita original a 'reprogramada' y liberar su cupo anterior
        String estadoAnterior = citaOriginal.getEstado();
        citaOriginal.setEstado("reprogramada");
        citaOriginal.setActualizadoEn(OffsetDateTime.now());
        citaRepository.save(citaOriginal);

        cupoDiarioService.liberarCupoAtomico(citaOriginal.getCupoDiario().getId());
        registrarTransicionEstado(citaOriginal, estadoAnterior, "reprogramada", usuario,
                "Reprogramada a nueva fecha: " + nuevoCupo.getFecha() + ". Motivo: " + dto.getMotivo());

        // 3. Crear nueva cita que enlaza a la original mediante cita_origen_id
        Cita nuevaCita = Cita.builder()
                .paciente(citaOriginal.getPaciente())
                .cupoDiario(nuevoCupo)
                .estado("pendiente")
                .citaOrigen(citaOriginal)
                .registradoPor(usuario)
                .version(0)
                .creadoEn(OffsetDateTime.now())
                .actualizadoEn(OffsetDateTime.now())
                .build();

        calcularHoraYVentanaSiCorresponde(nuevaCita, nuevoCupo);
        Cita citaNuevaGuardada = citaRepository.save(nuevaCita);

        registrarTransicionEstado(citaNuevaGuardada, null, "pendiente", usuario,
                "Cita generada por reprogramación de cita previa #" + citaOriginal.getId() + ". Motivo: " + dto.getMotivo());

        publicarAuditoriaGeneral(citaOriginal.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "reprogramada", "motivo", dto.getMotivo()));

        publicarAuditoriaGeneral(citaNuevaGuardada.getId(), "crear", usuario.getId(),
                Map.of("citaOrigenId", citaOriginal.getId()),
                Map.of("estado", "pendiente", "nuevoCupoDiarioId", nuevoCupo.getId()));

        log.info("Cita #{} reprogramada exitosamente hacia nueva cita #{} en fecha {}", citaId, citaNuevaGuardada.getId(), nuevoCupo.getFecha());
        return mapToDTO(citaNuevaGuardada);
    }

    /**
     * Cancelación anticipada de cita con liberación atómica del cupo y registro de motivo obligatorio.
     */
    @Transactional
    public CitaResponseDTO cancelarCita(Long citaId, CancelarCitaRequestDTO dto) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", citaId));

        if (ESTADOS_TERMINALES.contains(cita.getEstado())) {
            throw new BusinessException(String.format("No se puede cancelar una cita con estado terminal: '%s'", cita.getEstado()));
        }

        Long usuarioId = UsuarioContexto.resolverId(dto.getUsuarioId());
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));

        String estadoAnterior = cita.getEstado();
        cita.setEstado("cancelada");
        cita.setActualizadoEn(OffsetDateTime.now());
        Cita citaCancelada = citaRepository.save(cita);

        // Liberar el cupo atómicamente para que quede disponible para otro paciente
        cupoDiarioService.liberarCupoAtomico(cita.getCupoDiario().getId());

        registrarTransicionEstado(citaCancelada, estadoAnterior, "cancelada", usuario, dto.getMotivo());

        publicarAuditoriaGeneral(citaCancelada.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", "cancelada", "motivo", dto.getMotivo()));

        log.info("Cita #{} cancelada. Cupo liberado exitosamente.", citaId);
        return mapToDTO(citaCancelada);
    }

    /**
     * Transición manual de estado de cita con validación estricta y auditoría obligatoria.
     */
    @Transactional
    public CitaResponseDTO cambiarEstadoCita(Long citaId, CambiarEstadoCitaRequestDTO dto) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", citaId));

        Long usuarioId = UsuarioContexto.resolverId(dto.getUsuarioId());
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));

        String estadoAnterior = cita.getEstado();
        String nuevoEstado = dto.getNuevoEstado();

        validarTransicionValida(estadoAnterior, nuevoEstado);

        cita.setEstado(nuevoEstado);
        cita.setActualizadoEn(OffsetDateTime.now());
        Cita citaActualizada = citaRepository.save(cita);

        // Si se cancela por esta vía, liberar el cupo atómicamente
        if ("cancelada".equalsIgnoreCase(nuevoEstado)) {
            cupoDiarioService.liberarCupoAtomico(cita.getCupoDiario().getId());
        }

        String motivo = dto.getMotivo() != null ? dto.getMotivo() : "Transición operativa a " + nuevoEstado;
        registrarTransicionEstado(citaActualizada, estadoAnterior, nuevoEstado, usuario, motivo);

        publicarAuditoriaGeneral(citaActualizada.getId(), "actualizar", usuario.getId(),
                Map.of("estado", estadoAnterior),
                Map.of("estado", nuevoEstado, "motivo", motivo));

        return mapToDTO(citaActualizada);
    }

    /**
     * Cierre operativo del día: Pasa las citas pendientes no presentadas a 'no_asistio'.
     * Delega la lógica de negocio y auditoría a la función atómica PostgreSQL 'fn_cierre_diario_inasistencias',
     * garantizando alto rendimiento y transaccionalidad completa en el motor de base de datos.
     * IMPORTANTE: No se libera cupo diario ya que la jornada finalizó.
     */
    @Transactional
    public int ejecutarCierreDiario(LocalDate fecha, Long subespecialidadId, Long usuarioId) {
        Long usuarioResueltoId = UsuarioContexto.resolverId(usuarioId);
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioResueltoId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioResueltoId));

        int procesadas = 0;
        try {
            procesadas = citaRepository.ejecutarCierreDiarioSp(fecha, subespecialidadId, usuarioResueltoId);
            log.info("Cierre diario completado exitosamente mediante función atómica BD fn_cierre_diario_inasistencias para fecha {}. {} citas marcadas como 'no_asistio'.", fecha, procesadas);
        } catch (Exception e) {
            log.warn("Error al ejecutar fn_cierre_diario_inasistencias en BD ({}), recurriendo a procesamiento de reserva en Java...", e.getMessage());
            List<Cita> pendientes = citaRepository.buscarCitasPendientesParaCierre(fecha, subespecialidadId);
            for (Cita c : pendientes) {
                String anterior = c.getEstado();
                c.setEstado("no_asistio");
                c.setActualizadoEn(OffsetDateTime.now());
                citaRepository.save(c);

                registrarTransicionEstado(c, anterior, "no_asistio", usuario,
                        "Inasistencia al cierre de jornada: Paciente no se presentó a check-in en enfermería.");
                procesadas++;
            }
        }

        return procesadas;
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

    @Transactional(readOnly = true)
    public CitaResponseDTO obtenerPorId(Long citaId) {
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", citaId));
        return mapToDTO(cita);
    }

    /**
     * Cálculo de hora estimada lineal provisional y ventana de tolerancia con incremento acumulado.
     * Soporta citas cargadas en papel donde horaEstimada es null.
     */
    private void calcularHoraYVentanaSiCorresponde(Cita cita, CupoDiario cupo) {
        if (cita.getHoraEstimada() != null && cita.getHoraVentanaInicio() != null && cita.getHoraVentanaFin() != null) {
            return;
        }

        // Posición en la fila para ese cupo diario
        int posicion = (int) citaRepository.contarCitasActivasEnCupo(cupo.getId()) + 1;

        // Duración promedio de la consulta
        // TODO: Sustituir valor por defecto por estudio de tiempos promedio por especialidad/médico.
        int duracion = duracionEfectiva(cupo.getMedicoSubespecialidad());

        LocalTime horaInicioJornada = cupo.getMedicoSubespecialidad().getHoraInicio();

        // Invocación a función nativa PostgreSQL fn_calcular_hora_estimada
        LocalTime horaEstimada = null;
        try {
            horaEstimada = citaRepository.calcularHoraEstimada(horaInicioJornada, duracion, posicion);
        } catch (Exception e) {
            log.debug("No se pudo invocar fn_calcular_hora_estimada en BD, ejecutando cálculo en memoria: {}", e.getMessage());
        }

        if (horaEstimada == null) {
            horaEstimada = horaInicioJornada.plusMinutes((long) (posicion - 1) * duracion);
        }

        if (horaEstimada.isAfter(cupo.getMedicoSubespecialidad().getHoraFin())) {
            log.warn("Hora estimada {} excede el fin de jornada {} del cupo {} (posición {}). "
                            + "Revise la capacidad/duración configurada para este médico-clínica.",
                    horaEstimada, cupo.getMedicoSubespecialidad().getHoraFin(), cupo.getId(), posicion);
        }

        // Cálculo de ventana con margen base e incremento por incertidumbre acumulada
        // TODO: Sustituir cálculo lineal por modelo estadístico basado en tasa histórica de inasistencia por clínica.
        int margenBase = agendaProperties.getVentana().getMargenBaseMinutos();
        int incremento = agendaProperties.getVentana().getIncrementoPorBloqueMinutos();
        int tamanioBloque = Math.max(1, agendaProperties.getVentana().getTamanioBloquePosiciones());
        int margenMaximo = agendaProperties.getVentana().getMargenMaximoMinutos();

        int bloques = (posicion - 1) / tamanioBloque;
        int margenCalculado = Math.min(margenMaximo, margenBase + (bloques * incremento));

        LocalTime ventanaInicio = horaEstimada.minusMinutes(margenCalculado);
        if (ventanaInicio.isBefore(horaInicioJornada)) {
            ventanaInicio = horaInicioJornada;
        }
        LocalTime ventanaFin = horaEstimada.plusMinutes((long) duracion + margenCalculado);

        cita.setHoraEstimada(horaEstimada);
        cita.setHoraVentanaInicio(ventanaInicio);
        cita.setHoraVentanaFin(ventanaFin);
    }

    private void validarTransicionValida(String estadoActual, String nuevoEstado) {
        if (estadoActual.equalsIgnoreCase(nuevoEstado)) {
            return;
        }
        if (ESTADOS_TERMINALES.contains(estadoActual)) {
            throw new BusinessException(String.format("No se puede cambiar el estado de una cita en estado terminal '%s'", estadoActual));
        }
        // De pendiente puede pasar a confirmada, cancelada, reprogramada, no_asistio
        // De confirmada puede pasar a atendida, cancelada, reprogramada, no_asistio
        if ("pendiente".equalsIgnoreCase(estadoActual)) {
            if (!Set.of("confirmada", "cancelada", "reprogramada", "no_asistio").contains(nuevoEstado)) {
                throw new BusinessException(String.format("Transición inválida de '%s' a '%s'", estadoActual, nuevoEstado));
            }
        } else if ("confirmada".equalsIgnoreCase(estadoActual)) {
            if (!Set.of("atendida", "cancelada", "reprogramada", "no_asistio").contains(nuevoEstado)) {
                throw new BusinessException(String.format("Transición inválida de '%s' a '%s'", estadoActual, nuevoEstado));
            }
        }
    }

    private void registrarTransicionEstado(Cita cita, String estadoAnterior, String estadoNuevo, UsuarioReferencia usuario, String motivo) {
        CitaEstadoHistorial historial = CitaEstadoHistorial.builder()
                .cita(cita)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(estadoNuevo)
                .usuarioReferencia(usuario)
                .motivo(motivo)
                .fechaCambio(OffsetDateTime.now())
                .build();
        historialRepository.save(historial);
    }

    private void publicarAuditoriaGeneral(Long citaId, String accion, Long usuarioId, Map<String, Object> valoresAnteriores, Map<String, Object> valoresNuevos) {
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("cita")
                .entidadId(citaId)
                .accion(accion)
                .usuarioReferenciaId(usuarioId)
                .valoresAnteriores(valoresAnteriores)
                .valoresNuevos(valoresNuevos)
                .build());
    }

    private CitaResponseDTO mapToDTO(Cita cita) {
        Integer posicionEnFila = null;
        Long minutosEsperaEstimados = null;
        if (cita.getHoraEstimada() != null) {
            LocalTime horaInicioJornada = cita.getCupoDiario().getMedicoSubespecialidad().getHoraInicio();
            int duracion = duracionEfectiva(cita.getCupoDiario().getMedicoSubespecialidad());
            minutosEsperaEstimados = Math.max(0, Duration.between(horaInicioJornada, cita.getHoraEstimada()).toMinutes());
            posicionEnFila = (int) (minutosEsperaEstimados / duracion) + 1;
        }

        return CitaResponseDTO.builder()
                .id(cita.getId())
                .pacienteId(cita.getPaciente().getId())
                .pacienteNombreCompleto(cita.getPaciente().getNombres() + " " + cita.getPaciente().getApellidos())
                .pacienteDpi(cita.getPaciente().getDpi())
                .pacienteExpediente(cita.getPaciente().getNumeroExpediente())
                .cupoDiarioId(cita.getCupoDiario().getId())
                .fechaCita(cita.getCupoDiario().getFecha())
                .subespecialidadNombre(cita.getCupoDiario().getMedicoSubespecialidad().getSubespecialidad().getNombre())
                .medicoNombre(cita.getCupoDiario().getMedicoSubespecialidad().getMedico().getNombres())
                .horaEstimada(cita.getHoraEstimada())
                .horaVentanaInicio(cita.getHoraVentanaInicio())
                .horaVentanaFin(cita.getHoraVentanaFin())
                .posicionEnFila(posicionEnFila)
                .minutosEsperaEstimados(minutosEsperaEstimados)
                .estado(cita.getEstado())
                .citaOrigenId(cita.getCitaOrigen() != null ? cita.getCitaOrigen().getId() : null)
                .version(cita.getVersion())
                .creadoEn(cita.getCreadoEn())
                .actualizadoEn(cita.getActualizadoEn())
                .build();
    }

    /**
     * Duración efectiva de consulta del médico-clínica, con respaldo en la configuración global.
     */
    private int duracionEfectiva(MedicoSubespecialidad medicoSubespecialidad) {
        Integer configurada = medicoSubespecialidad.getDuracionConsultaMinutos();
        return (configurada != null && configurada > 0)
                ? configurada
                : agendaProperties.getDuracionConsultaDefaultMinutos();
    }
}
