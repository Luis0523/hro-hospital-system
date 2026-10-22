package com.hro.system.turnoestacion.service;

import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.estacion.context.EstacionContexto;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.entity.EstacionSubespecialidad;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.estacion.repository.EstacionSubespecialidadRepository;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.service.ExpedienteHroService;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.turnoestacion.dto.*;
import com.hro.system.turnoestacion.entity.DevolucionClinica;
import com.hro.system.turnoestacion.entity.EstadoTurnoEstacion;
import com.hro.system.turnoestacion.entity.TurnoEstacion;
import com.hro.system.turnoestacion.entity.TurnoEstacionMovimiento;
import com.hro.system.turnoestacion.repository.DevolucionClinicaRepository;
import com.hro.system.turnoestacion.repository.TurnoEstacionMovimientoRepository;
import com.hro.system.turnoestacion.repository.TurnoEstacionRepository;
import com.hro.system.turno.dto.TableroTurnoDTO;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TurnoEstacionService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    private final TurnoEstacionRepository turnoRepository;
    private final TurnoEstacionMovimientoRepository movimientoRepository;
    private final DevolucionClinicaRepository devolucionClinicaRepository;
    private final EstacionEnfermeriaRepository estacionRepository;
    private final EstacionSubespecialidadRepository estacionSubespecialidadRepository;
    private final EspecialidadRepository especialidadRepository;
    private final EspacioFisicoRepository espacioFisicoRepository;
    private final AsignacionDiariaEspacioRepository asignacionDiariaEspacioRepository;
    private final MedicoRepository medicoRepository;
    private final PacienteRepository pacienteRepository;
    private final CitaRepository citaRepository;
    private final ExpedienteRepository expedienteRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final EnfermeriaArchivoBridgeService archivoBridge;
    private final ExpedienteHroService expedienteHroService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<TurnoEstacionResponseDTO> listar(LocalDate fecha, Long estacionId,
                                                 Long especialidadId, UUID espacioFisicoId,
                                                 String estado) {
        LocalDate dia = fecha != null ? fecha : hoy();
        Long estacion = resolverEstacion(estacionId);
        EstadoTurnoEstacion filtroEstado = parseEstado(estado);

        return turnoRepository.findByFechaAndActivoTrueOrderByNumeroGeneralAsc(dia).stream()
                .filter(t -> estacion == null || t.getEstacion().getId().equals(estacion))
                .filter(t -> especialidadId == null || t.getEspecialidad().getId().equals(especialidadId))
                .filter(t -> espacioFisicoId == null
                        || (t.getEspacioFisico() != null && t.getEspacioFisico().getId().equals(espacioFisicoId)))
                .filter(t -> filtroEstado == null || t.getEstado() == filtroEstado)
                .map(t -> toDTO(t, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public TurnoEstacionResponseDTO obtener(UUID id) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO crear(CrearTurnoEstacionRequestDTO dto) {
        validarAccesoEstacion(dto.getEstacionId());
        LocalDate dia = dto.getFecha() != null ? dto.getFecha() : hoy();
        EstacionEnfermeria estacion = estacionActiva(dto.getEstacionId());
        Especialidad especialidad = especialidadDeEstacion(estacion.getId(), dto.getEspecialidadId());
        UsuarioReferencia usuario = usuarioActual();

        Paciente paciente = null;
        if (dto.getPacienteId() != null) {
            paciente = pacienteRepository.findById(dto.getPacienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Paciente", "id", dto.getPacienteId()));
        }

        Expediente expediente = null;
        String numeroExpediente = normalizar(dto.getNumeroExpediente());
        if (numeroExpediente != null) {
            expediente = expedienteRepository.findByNumeroExpediente(numeroExpediente)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Expediente", "numeroExpediente", numeroExpediente));
            if (paciente != null && !paciente.getId().equals(expediente.getPaciente().getId())) {
                throw new ConflictException("PACIENTE_EXPEDIENTE_INCONSISTENTE",
                        "El paciente indicado no corresponde al expediente " + numeroExpediente);
            }
            paciente = expediente.getPaciente();
            if (turnoRepository.existsByFechaAndNumeroExpedienteAndActivoTrue(dia, numeroExpediente)) {
                throw new ConflictException("EXPEDIENTE_CON_TURNO",
                        "El expediente " + numeroExpediente + " ya tiene un turno activo para la fecha " + dia);
            }
        }

        if (paciente != null && turnoRepository.existsByFechaAndPacienteIdAndActivoTrue(dia, paciente.getId())) {
            throw new ConflictException("PACIENTE_CON_TURNO",
                    "El paciente ya tiene un turno activo para la fecha " + dia);
        }

        Cita cita = null;
        if (dto.getCitaId() != null) {
            cita = citaRepository.findById(dto.getCitaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", dto.getCitaId()));
            if (paciente != null && !paciente.getId().equals(cita.getPaciente().getId())) {
                throw new ConflictException("PACIENTE_CITA_INCONSISTENTE",
                        "La cita indicada no pertenece al paciente del turno");
            }
            if (paciente == null) {
                paciente = cita.getPaciente();
            }
            if (turnoRepository.existsByFechaAndCitaIdAndActivoTrue(dia, cita.getId())) {
                throw new ConflictException("CITA_CON_TURNO",
                        "La cita ya tiene un turno activo para la fecha " + dia);
            }
        }

        EspacioFisico espacio = dto.getEspacioFisicoId() != null
                ? validarClinicaParaEspecialidad(dto.getEspacioFisicoId(), especialidad, dia)
                : null;

        List<Object[]> filas = turnoRepository.asignarCorrelativos(
                estacion.getId(), especialidad.getId(), dia);
        if (filas.isEmpty() || filas.getFirst().length < 2 || filas.getFirst()[0] == null) {
            throw new ConflictException("CORRELATIVO_AGOTADO",
                    "Se agotó el correlativo configurado para la especialidad " + especialidad.getNombre());
        }

        int numeroGeneral = ((Number) filas.getFirst()[0]).intValue();
        int correlativo = ((Number) filas.getFirst()[1]).intValue();

        TurnoEstacion turno = TurnoEstacion.builder()
                .fecha(dia)
                .estacion(estacion)
                .especialidad(especialidad)
                .correlativoEspecialidad(correlativo)
                .numeroGeneral(numeroGeneral)
                .estado(EstadoTurnoEstacion.registrado)
                .paciente(paciente)
                .expediente(expediente)
                .numeroExpediente(numeroExpediente)
                .pacienteNombre(paciente != null ? nombreCompleto(paciente) : normalizar(dto.getPacienteNombre()))
                .cita(cita)
                .espacioFisico(espacio)
                .asignadoPor(espacio != null ? usuario : null)
                .asignadoEn(espacio != null ? OffsetDateTime.now() : null)
                .registradoPor(usuario)
                .registradoEn(OffsetDateTime.now())
                .llamados(0)
                .activo(true)
                .version(0)
                .creadoEn(OffsetDateTime.now())
                .actualizadoEn(OffsetDateTime.now())
                .build();

        TurnoEstacion guardado = turnoRepository.save(turno);
        String observacion = espacio != null
                ? "Turno registrado en estación " + estacion.getNombre()
                    + " con clínica destino " + espacio.getNumero()
                : "Turno registrado en estación " + estacion.getNombre() + " sin clínica asignada";
        registrarMovimiento(guardado, null, EstadoTurnoEstacion.registrado, usuario, null, observacion);

        log.info("Turno de estación {} creado: general={} especialidad={} {}",
                guardado.getId(), numeroGeneral, especialidad.getNombre(), guardado.getCorrelativoEspecialidad());
        return toDTO(guardado, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO recibir(UUID id) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        if (turno.getEstado() == EstadoTurnoEstacion.recibido) {
            return toDTO(turno, true);
        }
        UsuarioReferencia usuario = usuarioActual();
        turno.setRecibidoPor(usuario);
        turno.setRecibidoEn(OffsetDateTime.now());
        cambiarEstado(turno, EstadoTurnoEstacion.recibido, usuario, null,
                "Paciente recibido en enfermería");
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO asignarClinica(UUID id, AsignarClinicaRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        if (turno.getEstado() == EstadoTurnoEstacion.en_clinica
                && turno.getEspacioFisico() != null
                && turno.getEspacioFisico().getId().equals(dto.getEspacioFisicoId())) {
            return toDTO(turno, true);
        }
        if (turno.getEstado() != EstadoTurnoEstacion.recibido) {
            throw new ConflictException("TRANSICION_INVALIDA",
                    "Solo se puede asignar clínica a un turno en estado 'recibido'");
        }
        EspacioFisico espacio = validarEspacioActivo(dto.getEspacioFisicoId());
        UsuarioReferencia usuario = usuarioActual();

        turno.setEspacioFisico(espacio);
        turno.setAsignadoPor(usuario);
        turno.setAsignadoEn(OffsetDateTime.now());
        cambiarEstado(turno, EstadoTurnoEstacion.en_clinica, usuario, null,
                "Paciente enviado a la clínica " + espacio.getNumero());
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO cambiarClinica(UUID id, AsignarClinicaRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        if (turno.getEstado() != EstadoTurnoEstacion.registrado
                && turno.getEstado() != EstadoTurnoEstacion.recibido) {
            throw new ConflictException("CAMBIO_CLINICA_NO_PERMITIDO",
                    "Solo se puede asignar o cambiar la clínica antes de 'en_clinica'");
        }
        if (turno.getEspacioFisico() != null
                && turno.getEspacioFisico().getId().equals(dto.getEspacioFisicoId())) {
            return toDTO(turno, true);
        }

        EspacioFisico espacio = validarClinicaParaEspecialidad(
                dto.getEspacioFisicoId(), turno.getEspecialidad(), turno.getFecha());
        UsuarioReferencia usuario = usuarioActual();
        String anterior = turno.getEspacioFisico() != null
                ? turno.getEspacioFisico().getNumero() : "sin clínica";

        turno.setEspacioFisico(espacio);
        turno.setAsignadoPor(usuario);
        turno.setAsignadoEn(OffsetDateTime.now());
        turno.setActualizadoEn(OffsetDateTime.now());
        turnoRepository.save(turno);
        registrarMovimiento(turno, turno.getEstado(), turno.getEstado(), usuario, null,
                "Clínica cambiada de " + anterior + " a " + espacio.getNumero());
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO vincularExpediente(UUID id, VincularExpedienteRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        validarEstadoEnClinica(turno);
        validarClinicaDelTurno(turno, dto.getEspacioFisicoId());
        Medico medico = medicoActivo(dto.getNumeroColegiado());

        String numeroExpediente = normalizar(dto.getNumeroExpediente());
        if (turno.getExpediente() != null) {
            if (numeroExpediente.equals(turno.getExpediente().getNumeroExpediente())) {
                return toDTO(turno, true);
            }
            throw new ConflictException("EXPEDIENTE_YA_VINCULADO",
                    "El turno ya está vinculado al expediente " + turno.getExpediente().getNumeroExpediente());
        }

        if (numeroExpediente.equals(turno.getNumeroExpediente())) {
            return toDTO(turno, true);
        }
        if (turno.getNumeroExpediente() != null) {
            throw new ConflictException("EXPEDIENTE_YA_VINCULADO",
                    "El turno ya está vinculado al expediente " + turno.getNumeroExpediente());
        }

        Optional<Expediente> local = expedienteRepository.findByNumeroExpediente(numeroExpediente);
        if (local.isPresent()) {
            Expediente expediente = local.get();
            if (turno.getPaciente() != null
                    && !turno.getPaciente().getId().equals(expediente.getPaciente().getId())) {
                throw new ConflictException("PACIENTE_EXPEDIENTE_INCONSISTENTE",
                        "El expediente no corresponde al paciente registrado en el turno");
            }
            if (turnoRepository.existsByFechaAndNumeroExpedienteAndActivoTrue(turno.getFecha(), numeroExpediente)) {
                throw new ConflictException("EXPEDIENTE_CON_TURNO",
                        "El expediente " + numeroExpediente + " ya tiene otro turno activo para la fecha");
            }

            EnfermeriaArchivoBridgeService.VinculoExpediente vinculo = archivoBridge.vincular(
                    expediente, turno.getCita() != null ? turno.getCita().getId() : null,
                    dto.getObservacion());

            turno.setExpediente(expediente);
            turno.setExpedienteCiclo(vinculo.ciclo());
            turno.setNumeroExpediente(expediente.getNumeroExpediente());
            turno.setPaciente(expediente.getPaciente());
            turno.setPacienteNombre(nombreCompleto(expediente.getPaciente()));
        } else {
            // El expediente no vive en la BD local: se valida y consulta en el API del hospital.
            PacienteHroDTO externo = expedienteHroService.consultar(numeroExpediente);
            if (turnoRepository.existsByFechaAndNumeroExpedienteAndActivoTrue(turno.getFecha(), numeroExpediente)) {
                throw new ConflictException("EXPEDIENTE_CON_TURNO",
                        "El expediente " + numeroExpediente + " ya tiene otro turno activo para la fecha");
            }
            turno.setNumeroExpediente(numeroExpediente);
            turno.setPacienteNombre(externo.getNombreCompleto());
            turno.setPaciente(null);
            turno.setExpediente(null);
            turno.setExpedienteCiclo(null);
        }

        turno.setMedico(medico);
        turno.setActualizadoEn(OffsetDateTime.now());
        turnoRepository.save(turno);

        registrarMovimiento(turno, turno.getEstado(), turno.getEstado(), usuarioActual(), medico,
                "Expediente " + numeroExpediente + " vinculado por el médico "
                        + medico.getNombres() + " (" + medico.getNumeroColegiado() + ")");
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO llamar(UUID id, AccionMedicoRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        validarClinicaDelTurno(turno, dto.getEspacioFisicoId());
        Medico medico = medicoActivo(dto.getNumeroColegiado());
        UsuarioReferencia usuario = usuarioActual();

        turno.setLlamados((turno.getLlamados() == null ? 0 : turno.getLlamados()) + 1);
        turno.setUltimoLlamadoEn(OffsetDateTime.now());
        turno.setMedico(medico);
        cambiarEstado(turno, EstadoTurnoEstacion.llamado, usuario, medico,
                dto.getObservacion() != null ? dto.getObservacion() : "Paciente llamado a consulta");
        publicarLlamadoEnTablero(turno);
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO noAsistio(UUID id, AccionMedicoRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        validarClinicaDelTurno(turno, dto.getEspacioFisicoId());
        Medico medico = medicoActivo(dto.getNumeroColegiado());
        UsuarioReferencia usuario = usuarioActual();

        turno.setNoAsistioPor(usuario);
        turno.setNoAsistioEn(OffsetDateTime.now());
        turno.setMedico(medico);
        cambiarEstado(turno, EstadoTurnoEstacion.no_asistio, usuario, medico,
                dto.getObservacion() != null ? dto.getObservacion() : "Paciente no asistió al llamado");
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO atendido(UUID id, AccionMedicoRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        validarClinicaDelTurno(turno, dto.getEspacioFisicoId());
        Medico medico = medicoActivo(dto.getNumeroColegiado());
        UsuarioReferencia usuario = usuarioActual();

        turno.setAtendidoPor(usuario);
        turno.setAtendidoEn(OffsetDateTime.now());
        turno.setMedico(medico);
        cambiarEstado(turno, EstadoTurnoEstacion.atendido, usuario, medico,
                dto.getObservacion() != null ? dto.getObservacion() : "Paciente atendido");
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO devolver(UUID id, DevolverTurnoRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        UsuarioReferencia usuario = usuarioActual();
        String observacion = dto != null && dto.getObservacion() != null
                ? dto.getObservacion() : "Expediente devuelto a archivo";

        turno.setDevueltoPor(usuario);
        turno.setDevueltoEn(OffsetDateTime.now());
        cambiarEstado(turno, EstadoTurnoEstacion.devuelto, usuario, turno.getMedico(), observacion);
        archivoBridge.reflejarDevolucion(turno.getExpedienteCiclo(), observacion);
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO archivar(UUID id, ArchivarTurnoRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        UsuarioReferencia usuario = usuarioActual();
        String observacion = dto != null && dto.getObservacion() != null
                ? dto.getObservacion() : "Turno archivado";

        turno.setArchivadoPor(usuario);
        turno.setArchivadoEn(OffsetDateTime.now());
        cambiarEstado(turno, EstadoTurnoEstacion.archivado, usuario, turno.getMedico(), observacion);
        archivoBridge.reflejarArchivado(turno.getExpedienteCiclo(),
                dto != null ? dto.getUbicacionDestinoId() : null, observacion);
        return toDTO(turno, true);
    }

    @Transactional
    public TurnoEstacionResponseDTO revertir(UUID id) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);

        if (turno.getEstado() == EstadoTurnoEstacion.registrado
                || turno.getEstado() == EstadoTurnoEstacion.devuelto
                || turno.getEstado() == EstadoTurnoEstacion.archivado) {
            throw new ConflictException("TURNO_NO_REVERSIBLE",
                    "El turno no se puede revertir desde el estado '" + turno.getEstado() + "'");
        }

        TurnoEstacionMovimiento ultimo = movimientoRepository
                .findFirstByTurnoEstacionIdAndEstadoNuevoAndEstadoAnteriorNotOrderByFechaMovimientoDescIdDesc(
                        turno.getId(), turno.getEstado(), turno.getEstado())
                .orElseThrow(() -> new ConflictException("SIN_ESTADO_ANTERIOR",
                        "No hay un estado anterior para revertir"));

        EstadoTurnoEstacion anterior = ultimo.getEstadoAnterior();
        if (anterior == null || anterior == turno.getEstado()) {
            throw new ConflictException("SIN_ESTADO_ANTERIOR",
                    "No hay un estado anterior para revertir");
        }

        EstadoTurnoEstacion actual = turno.getEstado();
        switch (actual) {
            case recibido -> {
                turno.setRecibidoPor(null);
                turno.setRecibidoEn(null);
            }
            case en_clinica -> {
                turno.setEspacioFisico(null);
                turno.setAsignadoPor(null);
                turno.setAsignadoEn(null);
            }
            case llamado -> {
                int llamados = Math.max(0, (turno.getLlamados() == null ? 0 : turno.getLlamados()) - 1);
                turno.setLlamados(llamados);
                if (llamados == 0) turno.setUltimoLlamadoEn(null);
            }
            case no_asistio -> {
                turno.setNoAsistioPor(null);
                turno.setNoAsistioEn(null);
            }
            case atendido -> {
                turno.setAtendidoPor(null);
                turno.setAtendidoEn(null);
            }
            default -> throw new ConflictException("TURNO_NO_REVERSIBLE",
                    "El turno no se puede revertir desde el estado '" + actual + "'");
        }

        UsuarioReferencia usuario = usuarioActual();
        turno.setEstado(anterior);
        turno.setActualizadoEn(OffsetDateTime.now());
        turnoRepository.save(turno);
        registrarMovimiento(turno, actual, anterior, usuario, turno.getMedico(),
                "Estado revertido de " + actual + " a " + anterior);
        log.info("Turno de estación {} revertido de {} a {}", id, actual, anterior);
        return toDTO(turno, true);
    }

    @Transactional
    public void eliminar(UUID id, EliminarTurnoRequestDTO dto) {
        TurnoEstacion turno = cargar(id);
        validarAccesoEstacion(turno);
        if (turno.getEstado() != EstadoTurnoEstacion.registrado) {
            throw new ConflictException("TURNO_NO_ELIMINABLE",
                    "Solo se puede eliminar un turno en estado 'registrado'");
        }
        if (turno.getPaciente() != null || turno.getExpediente() != null
                || normalizar(turno.getNumeroExpediente()) != null) {
            throw new ConflictException("TURNO_CON_PACIENTE",
                    "No se puede eliminar un turno que ya tiene paciente o expediente vinculado");
        }

        boolean ultimoGeneral = turnoRepository
                .findFirstByFechaAndEstacionIdAndActivoTrueOrderByNumeroGeneralDesc(
                        turno.getFecha(), turno.getEstacion().getId())
                .map(t -> t.getId().equals(turno.getId()))
                .orElse(false);

        if (ultimoGeneral) {
            turnoRepository.decrementarTurnoGeneral(
                    turno.getEstacion().getId(), turno.getFecha(), turno.getNumeroGeneral());
            turnoRepository.decrementarCorrelativoEspecialidad(
                    turno.getEspecialidad().getId(), turno.getFecha(), turno.getCorrelativoEspecialidad());
            movimientoRepository.deleteByTurnoEstacionId(turno.getId());
            turnoRepository.delete(turno);
            turnoRepository.flush();
            log.info("Turno de estación {} eliminado físicamente y contadores decrementados", id);
            return;
        }

        turno.setActivo(false);
        turno.setEliminadoPor(usuarioActual());
        turno.setEliminadoEn(OffsetDateTime.now());
        turno.setMotivoEliminacion(dto != null && dto.getMotivo() != null
                ? dto.getMotivo() : "Turno eliminado por enfermería");
        turno.setActualizadoEn(OffsetDateTime.now());
        turnoRepository.save(turno);
        registrarMovimiento(turno, turno.getEstado(), turno.getEstado(), turno.getEliminadoPor(), null,
                "Turno desactivado sin reutilizar el número " + turno.getNumeroGeneral());
        log.info("Turno de estación {} dado de baja lógica", id);
    }

    @Transactional(readOnly = true)
    public List<ResumenClinicaDTO> resumenClinicas(LocalDate fecha, Long estacionId) {
        LocalDate dia = fecha != null ? fecha : hoy();
        Long estacionRef = resolverEstacion(estacionId);
        if (estacionRef == null) {
            throw new BusinessException("ESTACION_REQUERIDA",
                    "Debe indicar la estación para consultar las clínicas");
        }
        EstacionEnfermeria estacion = estacionActiva(estacionRef);
        validarAccesoEstacion(estacion.getId());
        return construirResumenClinicas(dia, estacion);
    }

    @Transactional
    public ResumenClinicaDTO registrarDevolucionClinica(UUID espacioFisicoId, LocalDate fecha,
                                                         Long estacionId) {
        LocalDate dia = fecha != null ? fecha : hoy();
        Long estacionRef = resolverEstacion(estacionId);
        if (estacionRef == null) {
            throw new BusinessException("ESTACION_REQUERIDA",
                    "Debe indicar la estación para registrar la devolución");
        }
        EstacionEnfermeria estacion = estacionActiva(estacionRef);
        validarAccesoEstacion(estacion.getId());
        EspacioFisico espacio = validarEspacioActivo(espacioFisicoId);

        ResumenClinicaDTO actual = construirResumenClinicas(dia, estacion).stream()
                .filter(item -> item.getEspacioFisicoId().equals(espacio.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "EspacioFisico", "id", espacioFisicoId));
        if (actual.getPendientes() <= 0) {
            throw new ConflictException("SIN_PENDIENTES",
                    "No hay pacientes pendientes de devolver en la clínica " + espacio.getNumero());
        }

        DevolucionClinica devolucion = DevolucionClinica.builder()
                .estacion(estacion)
                .espacioFisico(espacio)
                .fecha(dia)
                .usuario(usuarioActual())
                .creadoEn(OffsetDateTime.now())
                .observacion("Devolución registrada desde seguimiento de enfermería")
                .build();
        devolucionClinicaRepository.saveAndFlush(devolucion);
        log.info("Devolución agregada registrada: estación={} clínica={} fecha={}",
                estacion.getId(), espacio.getNumero(), dia);
        return construirResumenClinicas(dia, estacion).stream()
                .filter(item -> item.getEspacioFisicoId().equals(espacio.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "EspacioFisico", "id", espacioFisicoId));
    }

    @Transactional
    public ResumenClinicaDTO deshacerDevolucionClinica(UUID espacioFisicoId, LocalDate fecha,
                                                       Long estacionId) {
        LocalDate dia = fecha != null ? fecha : hoy();
        Long estacionRef = resolverEstacion(estacionId);
        if (estacionRef == null) {
            throw new BusinessException("ESTACION_REQUERIDA",
                    "Debe indicar la estación para deshacer la devolución");
        }
        EstacionEnfermeria estacion = estacionActiva(estacionRef);
        validarAccesoEstacion(estacion.getId());
        EspacioFisico espacio = validarEspacioActivo(espacioFisicoId);

        DevolucionClinica ultima = devolucionClinicaRepository
                .findFirstByFechaAndEstacionIdAndEspacioFisicoIdAndRevertidoEnIsNullOrderByCreadoEnDescIdDesc(
                        dia, estacion.getId(), espacio.getId())
                .orElseThrow(() -> new ConflictException("SIN_DEVOLUCIONES",
                        "No hay devoluciones para deshacer en la clínica " + espacio.getNumero()));
        ultima.setRevertidoEn(OffsetDateTime.now());
        ultima.setRevertidoPor(usuarioActual());
        devolucionClinicaRepository.saveAndFlush(ultima);
        log.info("Devolución agregada deshecha: estación={} clínica={} fecha={}",
                estacion.getId(), espacio.getNumero(), dia);
        return construirResumenClinicas(dia, estacion).stream()
                .filter(item -> item.getEspacioFisicoId().equals(espacio.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "EspacioFisico", "id", espacioFisicoId));
    }

    private List<ResumenClinicaDTO> construirResumenClinicas(LocalDate dia,
                                                              EstacionEnfermeria estacion) {
        List<TurnoEstacion> turnos = turnoRepository
                .findByFechaAndEstacionIdAndActivoTrueOrderByNumeroGeneralAsc(dia, estacion.getId());
        Map<UUID, Long> asignados = turnos.stream()
                .filter(turno -> turno.getEspacioFisico() != null)
                .collect(Collectors.groupingBy(
                        turno -> turno.getEspacioFisico().getId(), Collectors.counting()));
        Map<UUID, List<DevolucionClinica>> devoluciones = devolucionClinicaRepository
                .findByFechaAndEstacionIdAndRevertidoEnIsNull(dia, estacion.getId()).stream()
                .collect(Collectors.groupingBy(devolucion -> devolucion.getEspacioFisico().getId()));

        return espacioFisicoRepository.findByActivoTrue().stream()
                .sorted(Comparator.comparing(EspacioFisico::getNumero,
                        Comparator.nullsLast(String::compareTo)))
                .map(espacio -> {
                    long totalAsignados = asignados.getOrDefault(espacio.getId(), 0L);
                    List<DevolucionClinica> devolucionesClinica = devoluciones
                            .getOrDefault(espacio.getId(), List.of());
                    long totalDevueltos = devolucionesClinica.size();
                    OffsetDateTime ultima = devolucionesClinica.stream()
                            .map(DevolucionClinica::getCreadoEn)
                            .filter(Objects::nonNull)
                            .max(Comparator.naturalOrder())
                            .orElse(null);
                    return ResumenClinicaDTO.builder()
                            .espacioFisicoId(espacio.getId())
                            .numero(espacio.getNumero())
                            .nombre(espacio.getNombre())
                            .nivel(espacio.getNivel())
                            .asignados(totalAsignados)
                            .devueltos(totalDevueltos)
                            .pendientes(Math.max(0L, totalAsignados - totalDevueltos))
                            .ultimaDevolucionEn(ultima)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public LibroTurnoEstacionResponseDTO libro(LocalDate fecha, Long estacionId) {
        LocalDate dia = fecha != null ? fecha : hoy();
        Long estacionRef = resolverEstacion(estacionId);
        if (estacionRef == null) {
            throw new BusinessException("ESTACION_REQUERIDA", "Debe indicar la estación para consultar el libro");
        }
        EstacionEnfermeria estacion = estacionActiva(estacionRef);
        List<TurnoEstacion> turnos = turnoRepository
                .findByFechaAndEstacionIdAndActivoTrueOrderByNumeroGeneralAsc(dia, estacion.getId());

        Map<String, Long> resumen = new LinkedHashMap<>();
        for (EstadoTurnoEstacion estado : EstadoTurnoEstacion.values()) {
            resumen.put(estado.name(), turnos.stream()
                    .filter(t -> t.getEstado() == estado)
                    .count());
        }

        Map<Long, LibroTurnoEstacionResponseDTO.LibroEspecialidadDTO> porEspecialidad = new LinkedHashMap<>();
        for (EstacionSubespecialidad config : estacionSubespecialidadRepository
                .findByEstacionIdAndActivoTrue(estacion.getId())) {
            if (config.getSubespecialidad() == null || config.getSubespecialidad().getEspecialidad() == null) {
                continue;
            }
            Especialidad especialidad = config.getSubespecialidad().getEspecialidad();
            if (!Boolean.TRUE.equals(especialidad.getActivo())) {
                continue;
            }
            porEspecialidad.computeIfAbsent(especialidad.getId(), key -> nuevaEntradaLibro(especialidad));
        }

        Map<Long, List<TurnoEstacion>> agrupados = turnos.stream()
                .collect(Collectors.groupingBy(t -> t.getEspecialidad().getId(), LinkedHashMap::new, Collectors.toList()));

        for (Map.Entry<Long, List<TurnoEstacion>> entry : agrupados.entrySet()) {
            LibroTurnoEstacionResponseDTO.LibroEspecialidadDTO item = porEspecialidad.get(entry.getKey());
            if (item == null) {
                item = nuevaEntradaLibro(entry.getValue().getFirst().getEspecialidad());
                porEspecialidad.put(entry.getKey(), item);
            }
            item.setTurnos(entry.getValue().stream().map(t -> toDTO(t, false)).toList());
            item.setRegistrados(entry.getValue().size());
        }

        for (LibroTurnoEstacionResponseDTO.LibroEspecialidadDTO item : porEspecialidad.values()) {
            if (item.getTurnos() == null) {
                item.setTurnos(List.of());
            }
        }

        return LibroTurnoEstacionResponseDTO.builder()
                .estacionId(estacion.getId())
                .estacionNombre(estacion.getNombre())
                .fecha(dia)
                .resumen(resumen)
                .especialidades(new ArrayList<>(porEspecialidad.values()))
                .build();
    }

    private LibroTurnoEstacionResponseDTO.LibroEspecialidadDTO nuevaEntradaLibro(Especialidad especialidad) {
        return LibroTurnoEstacionResponseDTO.LibroEspecialidadDTO.builder()
                .id(especialidad.getId())
                .nombre(especialidad.getNombre())
                .abreviatura(especialidad.getAbreviatura())
                .correlativoMax(especialidad.getCorrelativoMax())
                .registrados(0)
                .turnos(List.of())
                .build();
    }

    private void cambiarEstado(TurnoEstacion turno, EstadoTurnoEstacion destino,
                               UsuarioReferencia usuario, Medico medico, String observacion) {
        EstadoTurnoEstacion anterior = turno.getEstado();
        if (!anterior.puedeTransicionarA(destino)) {
            throw new ConflictException("TRANSICION_INVALIDA",
                    "No se puede pasar de '" + anterior + "' a '" + destino + "'");
        }
        turno.setEstado(destino);
        turno.setActualizadoEn(OffsetDateTime.now());
        turnoRepository.save(turno);
        registrarMovimiento(turno, anterior, destino, usuario, medico, observacion);
    }

    private void registrarMovimiento(TurnoEstacion turno, EstadoTurnoEstacion anterior,
                                     EstadoTurnoEstacion nuevo, UsuarioReferencia usuario,
                                     Medico medico, String observacion) {
        movimientoRepository.save(TurnoEstacionMovimiento.builder()
                .turnoEstacion(turno)
                .estadoAnterior(anterior)
                .estadoNuevo(nuevo)
                .usuarioReferencia(usuario)
                .medico(medico)
                .observacion(observacion)
                .fechaMovimiento(OffsetDateTime.now())
                .build());
    }

    private TurnoEstacion cargar(UUID id) {
        return turnoRepository.findById(id)
                .filter(t -> Boolean.TRUE.equals(t.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("TurnoEstacion", "id", id));
    }

    private EstacionEnfermeria estacionActiva(Long estacionId) {
        EstacionEnfermeria estacion = estacionRepository.findById(estacionId)
                .orElseThrow(() -> new ResourceNotFoundException("EstacionEnfermeria", "id", estacionId));
        if (!Boolean.TRUE.equals(estacion.getActivo())) {
            throw new BusinessException("ESTACION_INACTIVA", "La estación de enfermería está inactiva");
        }
        return estacion;
    }

    private Especialidad especialidadDeEstacion(Long estacionId, Long especialidadId) {
        Especialidad especialidad = especialidadRepository.findById(especialidadId)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad", "id", especialidadId));
        if (!Boolean.TRUE.equals(especialidad.getActivo())) {
            throw new BusinessException("ESPECIALIDAD_INACTIVA", "La especialidad está inactiva");
        }
        boolean pertenece = estacionSubespecialidadRepository.findByEstacionIdAndActivoTrue(estacionId).stream()
                .map(EstacionSubespecialidad::getSubespecialidad)
                .filter(Objects::nonNull)
                .map(sub -> sub.getEspecialidad())
                .filter(Objects::nonNull)
                .anyMatch(esp -> esp.getId().equals(especialidadId));
        if (!pertenece) {
            throw new BusinessException("ESPECIALIDAD_NO_PERTENECE",
                    "La especialidad no pertenece a la estación seleccionada");
        }
        return especialidad;
    }

    private void publicarLlamadoEnTablero(TurnoEstacion turno) {
        if (turno.getEspacioFisico() == null || turno.getEstacion() == null) return;

        long clave = Integer.toUnsignedLong(Objects.hash(
                turno.getEstacion().getId(), turno.getEspacioFisico().getId()));
        TableroTurnoDTO evento = TableroTurnoDTO.builder()
                .asignacionDiariaEspacioId(clave)
                .espacioNumero(turno.getEspacioFisico().getNumero())
                .nivel(turno.getEspacioFisico().getNivel())
                .subespecialidadNombre(turno.getEspecialidad() != null
                        ? turno.getEspecialidad().getNombre() : null)
                .especialidadId(turno.getEspecialidad() != null
                        ? turno.getEspecialidad().getId() : null)
                .turnoActual(turno.getNumeroGeneral())
                .ultimaActualizacion(OffsetDateTime.now())
                .intentosLlamado(turno.getLlamados())
                .tipoEvento("LLAMADO")
                .pacienteNombre(turno.getPacienteNombre())
                .turnosEnEspera(List.of())
                .porNombre(false)
                .build();

        messagingTemplate.convertAndSend("/topic/tablero", evento);
        messagingTemplate.convertAndSend(
                "/topic/estacion/" + turno.getEstacion().getId(), evento);
        log.info("Evento de llamado enviado al tablero: estación={} clínica={} turno={}",
                turno.getEstacion().getId(), turno.getEspacioFisico().getNumero(),
                turno.getNumeroGeneral());
    }

    private EspacioFisico validarClinicaParaEspecialidad(UUID espacioFisicoId,
                                                         Especialidad especialidad,
                                                         LocalDate fecha) {
        EspacioFisico espacio = validarEspacioActivo(espacioFisicoId);
        boolean asignada = asignacionDiariaEspacioRepository
                .existsByEspacioFisicoIdAndFechaAndEspecialidadId(
                        espacioFisicoId, fecha, especialidad.getId());
        if (!asignada) {
            throw new BusinessException("CLINICA_NO_ASIGNADA",
                    "La clínica " + espacio.getNumero() + " no está asignada a la especialidad "
                            + especialidad.getNombre() + " para la fecha " + fecha);
        }
        return espacio;
    }

    private EspacioFisico validarEspacioActivo(UUID espacioFisicoId) {
        EspacioFisico espacio = espacioFisicoRepository.findById(espacioFisicoId)
                .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", espacioFisicoId));
        if (!Boolean.TRUE.equals(espacio.getActivo())) {
            throw new BusinessException("ESPACIO_INACTIVO", "La clínica está fuera de servicio");
        }
        return espacio;
    }

    private void validarClinicaDelTurno(TurnoEstacion turno, UUID espacioFisicoId) {
        if (turno.getEspacioFisico() == null) {
            throw new ConflictException("SIN_CLINICA", "El turno todavía no tiene una clínica asignada");
        }
        if (!turno.getEspacioFisico().getId().equals(espacioFisicoId)) {
            throw new ConflictException("CLINICA_DISTINTA",
                    "El turno pertenece a la clínica " + turno.getEspacioFisico().getNumero());
        }
        if (!Boolean.TRUE.equals(turno.getEspacioFisico().getActivo())) {
            throw new BusinessException("ESPACIO_INACTIVO", "La clínica está fuera de servicio");
        }
    }

    private void validarEstadoEnClinica(TurnoEstacion turno) {
        if (turno.getEstado() != EstadoTurnoEstacion.en_clinica
                && turno.getEstado() != EstadoTurnoEstacion.llamado) {
            throw new ConflictException("TRANSICION_INVALIDA",
                    "El turno debe estar 'en_clinica' o 'llamado' para vincular el expediente");
        }
    }

    private Medico medicoActivo(String numeroColegiado) {
        String numero = normalizar(numeroColegiado);
        if (numero == null) {
            throw new BusinessException("COLEGIADO_REQUERIDO", "Debe indicar el número de colegiado del médico");
        }
        Medico medico = medicoRepository.findByNumeroColegiado(numero)
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "numeroColegiado", numero));
        if (!Boolean.TRUE.equals(medico.getActivo())) {
            throw new BusinessException("MEDICO_INACTIVO", "El médico está inactivo");
        }
        return medico;
    }

    private void validarAccesoEstacion(TurnoEstacion turno) {
        Optional<Long> estacionSesion = EstacionContexto.idActual();
        if (estacionSesion.isPresent() && !estacionSesion.get().equals(turno.getEstacion().getId())) {
            throw new BusinessException("ESTACION_INCORRECTA",
                    "El turno no pertenece a la estación de la sesión");
        }
    }

    private void validarAccesoEstacion(Long estacionId) {
        Optional<Long> estacionSesion = EstacionContexto.idActual();
        if (estacionSesion.isPresent() && !estacionSesion.get().equals(estacionId)) {
            throw new BusinessException("ESTACION_INCORRECTA",
                    "La estación indicada no coincide con la estación de la sesión");
        }
    }

    private Long resolverEstacion(Long estacionId) {
        return estacionId != null ? estacionId : EstacionContexto.idActual().orElse(null);
    }

    private EstadoTurnoEstacion parseEstado(String estado) {
        String valor = normalizar(estado);
        if (valor == null) {
            return null;
        }
        try {
            return EstadoTurnoEstacion.valueOf(valor.toLowerCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("ESTADO_INVALIDO", "Estado de turno no válido: " + estado);
        }
    }

    private UsuarioReferencia usuarioActual() {
        Long usuarioId = UsuarioContexto.idActual();
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));
    }

    private String nombreCompleto(Paciente paciente) {
        return (paciente.getNombres() + " " + paciente.getApellidos()).trim();
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private LocalDate hoy() {
        return LocalDate.now(ZONA_HORARIA);
    }

    private TurnoEstacionResponseDTO toDTO(TurnoEstacion turno, boolean conMovimientos) {
        Especialidad especialidad = turno.getEspecialidad();
        String abreviatura = especialidad != null ? normalizar(especialidad.getAbreviatura()) : null;
        String codigo = abreviatura != null
                ? abreviatura + turno.getCorrelativoEspecialidad()
                : "T" + turno.getNumeroGeneral();

        List<TurnoEstacionMovimientoResponseDTO> movimientos = conMovimientos
                ? movimientoRepository.findByTurnoEstacionIdOrderByFechaMovimientoAscIdAsc(turno.getId()).stream()
                        .map(this::toMovimientoDTO)
                        .toList()
                : null;

        return TurnoEstacionResponseDTO.builder()
                .id(turno.getId())
                .fecha(turno.getFecha())
                .estacionId(turno.getEstacion() != null ? turno.getEstacion().getId() : null)
                .estacionNombre(turno.getEstacion() != null ? turno.getEstacion().getNombre() : null)
                .especialidadId(especialidad != null ? especialidad.getId() : null)
                .especialidadNombre(especialidad != null ? especialidad.getNombre() : null)
                .abreviatura(abreviatura)
                .correlativoEspecialidad(turno.getCorrelativoEspecialidad())
                .codigo(codigo)
                .numeroGeneral(turno.getNumeroGeneral())
                .estado(turno.getEstado() != null ? turno.getEstado().name() : null)
                .pacienteId(turno.getPaciente() != null ? turno.getPaciente().getId() : null)
                .pacienteNombre(turno.getPaciente() != null
                        ? nombreCompleto(turno.getPaciente()) : turno.getPacienteNombre())
                .expedienteId(turno.getExpediente() != null ? turno.getExpediente().getId() : null)
                .numeroExpediente(turno.getNumeroExpediente())
                .citaId(turno.getCita() != null ? turno.getCita().getId() : null)
                .expedienteCicloId(turno.getExpedienteCiclo() != null ? turno.getExpedienteCiclo().getId() : null)
                .espacioFisicoId(turno.getEspacioFisico() != null ? turno.getEspacioFisico().getId() : null)
                .espacioFisicoNumero(turno.getEspacioFisico() != null ? turno.getEspacioFisico().getNumero() : null)
                .espacioFisicoNombre(turno.getEspacioFisico() != null ? turno.getEspacioFisico().getNombre() : null)
                .medicoId(turno.getMedico() != null ? turno.getMedico().getId() : null)
                .medicoNombre(turno.getMedico() != null ? turno.getMedico().getNombres() : null)
                .numeroColegiado(turno.getMedico() != null ? turno.getMedico().getNumeroColegiado() : null)
                .llamados(turno.getLlamados())
                .ultimoLlamadoEn(turno.getUltimoLlamadoEn())
                .registradoPor(turno.getRegistradoPor() != null ? turno.getRegistradoPor().getNombreMostrar() : null)
                .registradoEn(turno.getRegistradoEn())
                .recibidoPor(turno.getRecibidoPor() != null ? turno.getRecibidoPor().getNombreMostrar() : null)
                .recibidoEn(turno.getRecibidoEn())
                .asignadoPor(turno.getAsignadoPor() != null ? turno.getAsignadoPor().getNombreMostrar() : null)
                .asignadoEn(turno.getAsignadoEn())
                .atendidoPor(turno.getAtendidoPor() != null ? turno.getAtendidoPor().getNombreMostrar() : null)
                .atendidoEn(turno.getAtendidoEn())
                .noAsistioPor(turno.getNoAsistioPor() != null ? turno.getNoAsistioPor().getNombreMostrar() : null)
                .noAsistioEn(turno.getNoAsistioEn())
                .devueltoPor(turno.getDevueltoPor() != null ? turno.getDevueltoPor().getNombreMostrar() : null)
                .devueltoEn(turno.getDevueltoEn())
                .archivadoPor(turno.getArchivadoPor() != null ? turno.getArchivadoPor().getNombreMostrar() : null)
                .archivadoEn(turno.getArchivadoEn())
                .activo(turno.getActivo())
                .motivoEliminacion(turno.getMotivoEliminacion())
                .eliminadoEn(turno.getEliminadoEn())
                .observacion(turno.getObservacion())
                .movimientos(movimientos)
                .build();
    }

    private TurnoEstacionMovimientoResponseDTO toMovimientoDTO(TurnoEstacionMovimiento movimiento) {
        return TurnoEstacionMovimientoResponseDTO.builder()
                .id(movimiento.getId())
                .estadoAnterior(movimiento.getEstadoAnterior() != null
                        ? movimiento.getEstadoAnterior().name() : null)
                .estadoNuevo(movimiento.getEstadoNuevo() != null
                        ? movimiento.getEstadoNuevo().name() : null)
                .usuarioNombre(movimiento.getUsuarioReferencia() != null
                        ? movimiento.getUsuarioReferencia().getNombreMostrar() : null)
                .medicoNombre(movimiento.getMedico() != null ? movimiento.getMedico().getNombres() : null)
                .observacion(movimiento.getObservacion())
                .fechaMovimiento(movimiento.getFechaMovimiento())
                .build();
    }
}
