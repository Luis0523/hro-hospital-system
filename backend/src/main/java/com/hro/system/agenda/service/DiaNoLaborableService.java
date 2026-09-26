package com.hro.system.agenda.service;

import com.hro.system.agenda.dto.ActualizarDiaNoLaborableRequestDTO;
import com.hro.system.agenda.dto.CitaAfectadaDTO;
import com.hro.system.agenda.dto.CrearDiaNoLaborableRequestDTO;
import com.hro.system.agenda.dto.DiaNoLaborableConflictoDTO;
import com.hro.system.agenda.dto.DiaNoLaborableResponseDTO;
import com.hro.system.agenda.entity.DiaNoLaborable;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiaNoLaborableService {

    /** Código de error: la fecha ya está registrada como día no laborable. */
    public static final String CODIGO_YA_EXISTE = "DIA_NO_LABORABLE_YA_EXISTE";
    /** Código de error: existen citas activas que impiden bloquear la fecha. */
    public static final String CODIGO_CON_CITAS = "DIA_NO_LABORABLE_CON_CITAS";

    /**
     * Estados de cita que NO bloquean el bloqueo de una fecha. Cualquier otro
     * estado (pendiente, confirmada, atendida, no_asistio) se considera activo/bloqueante.
     */
    private static final Set<String> ESTADOS_NO_BLOQUEANTES = Set.of("cancelada", "reprogramada");

    private final DiaNoLaborableRepository diaNoLaborableRepository;
    private final CitaRepository citaRepository;
    private final UsuarioReferenciaRepository usuarioReferenciaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public DiaNoLaborableResponseDTO registrarDiaNoLaborable(CrearDiaNoLaborableRequestDTO dto) {
        if (diaNoLaborableRepository.existsByFecha(dto.getFecha())) {
            throw new BusinessException(CODIGO_YA_EXISTE,
                    "La fecha " + dto.getFecha() + " ya está registrada como día no laborable.");
        }

        List<Cita> citasBloqueantes = citaRepository.buscarCitasBloqueantesEnFecha(dto.getFecha(), ESTADOS_NO_BLOQUEANTES);
        boolean forzar = Boolean.TRUE.equals(dto.getForzar());

        if (!citasBloqueantes.isEmpty() && !forzar) {
            throw new ConflictException(CODIGO_CON_CITAS,
                    "Existen " + citasBloqueantes.size() + " cita(s) activa(s) para el " + dto.getFecha()
                            + ". Confirme el bloqueo para continuar: las citas deberán reprogramarse.",
                    DiaNoLaborableConflictoDTO.builder()
                            .codigo(CODIGO_CON_CITAS)
                            .fecha(dto.getFecha())
                            .totalCitas(citasBloqueantes.size())
                            .citas(citasBloqueantes.stream().map(this::mapCitaAfectada).toList())
                            .build());
        }

        UsuarioReferencia creadoPor = resolverCreadoPor(dto.getCreadoPorId());

        DiaNoLaborable dia = DiaNoLaborable.builder()
                .fecha(dto.getFecha())
                .motivo(dto.getMotivo().trim())
                .creadoPor(creadoPor)
                .creadoEn(OffsetDateTime.now())
                .build();

        DiaNoLaborable guardado = diaNoLaborableRepository.save(dia);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("dia_no_laborable")
                .entidadId(guardado.getId())
                .accion("crear")
                .usuarioReferenciaId(creadoPor.getId())
                .valoresNuevos(guardado)
                .build());

        if (forzar && !citasBloqueantes.isEmpty()) {
            log.warn("Día no laborable {} bloqueado de forma forzada con {} cita(s) activa(s) pendientes de reprogramar.",
                    guardado.getFecha(), citasBloqueantes.size());
        }
        log.info("Día no laborable registrado: {} ({}) por {}", guardado.getFecha(), guardado.getMotivo(), creadoPor.getNombreMostrar());
        return mapToDTO(guardado);
    }

    @Transactional
    public DiaNoLaborableResponseDTO actualizarDiaNoLaborable(Long id, ActualizarDiaNoLaborableRequestDTO dto) {
        DiaNoLaborable dia = diaNoLaborableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DiaNoLaborable", "id", id));

        dia.setMotivo(dto.getMotivo().trim());
        DiaNoLaborable guardado = diaNoLaborableRepository.save(dia);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("dia_no_laborable")
                .entidadId(guardado.getId())
                .accion("actualizar")
                .usuarioReferenciaId(guardado.getCreadoPor().getId())
                .valoresNuevos(guardado)
                .build());

        log.info("Día no laborable actualizado: {} ({})", guardado.getFecha(), guardado.getMotivo());
        return mapToDTO(guardado);
    }

    @Transactional
    public DiaNoLaborableResponseDTO eliminarDiaNoLaborable(Long id) {
        DiaNoLaborable dia = diaNoLaborableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DiaNoLaborable", "id", id));

        DiaNoLaborableResponseDTO response = mapToDTO(dia);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("dia_no_laborable")
                .entidadId(dia.getId())
                .accion("eliminar")
                .usuarioReferenciaId(dia.getCreadoPor().getId())
                .valoresAnteriores(dia)
                .build());

        diaNoLaborableRepository.delete(dia);
        log.info("Día no laborable eliminado: {}", dia.getFecha());
        return response;
    }

    @Transactional(readOnly = true)
    public DiaNoLaborableResponseDTO buscarPorId(Long id) {
        return mapToDTO(diaNoLaborableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DiaNoLaborable", "id", id)));
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborableResponseDTO> listarTodos() {
        return diaNoLaborableRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborableResponseDTO> listarFuturos() {
        return diaNoLaborableRepository.findFuturos(LocalDate.now()).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborableResponseDTO> listarPorRango(LocalDate inicio, LocalDate fin) {
        return diaNoLaborableRepository.findByRangoFechas(inicio, fin).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean esDiaNoLaborable(LocalDate fecha) {
        return diaNoLaborableRepository.existsByFecha(fecha);
    }

    private UsuarioReferencia resolverCreadoPor(Long creadoPorId) {
        if (creadoPorId != null) {
            UsuarioReferencia usuario = usuarioReferenciaRepository.findById(creadoPorId).orElse(null);
            if (usuario != null) {
                return usuario;
            }
        }
        return usuarioReferenciaRepository.findAll().stream().findFirst()
                .orElseGet(() -> usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                        .idExterno("system-admin")
                        .nombreMostrar("Administrador HRO")
                        .rolPrincipal("administrador")
                        .activo(true)
                        .build()));
    }

    private CitaAfectadaDTO mapCitaAfectada(Cita c) {
        return CitaAfectadaDTO.builder()
                .id(c.getId())
                .horaEstimada(c.getHoraEstimada())
                .estado(c.getEstado())
                .pacienteId(c.getPaciente().getId())
                .pacienteNombre(c.getPaciente().getNombres() + " " + c.getPaciente().getApellidos())
                .medicoNombre(c.getCupoDiario().getMedicoSubespecialidad().getMedico().getNombres())
                .subespecialidadNombre(c.getCupoDiario().getMedicoSubespecialidad().getSubespecialidad().getNombre())
                .build();
    }

    private DiaNoLaborableResponseDTO mapToDTO(DiaNoLaborable d) {
        return DiaNoLaborableResponseDTO.builder()
                .id(d.getId())
                .fecha(d.getFecha())
                .motivo(d.getMotivo())
                .creadoPorId(d.getCreadoPor().getId())
                .creadoPorNombre(d.getCreadoPor().getNombreMostrar())
                .creadoEn(d.getCreadoEn())
                .build();
    }
}
