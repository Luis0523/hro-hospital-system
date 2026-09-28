package com.hro.system.clinica.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.clinica.dto.SubespecialidadHorarioRequestDTO;
import com.hro.system.clinica.dto.SubespecialidadHorarioResponseDTO;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Horario semanal por subespecialidad (días y horas), independiente del médico.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubespecialidadHorarioService {

    private static final String[] DIAS = {
            "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
    };

    private final SubespecialidadHorarioRepository horarioRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<SubespecialidadHorarioResponseDTO> listarPorSubespecialidad(Long subespecialidadId) {
        subespecialidadRepository.findById(subespecialidadId)
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", subespecialidadId));
        return horarioRepository.findBySubespecialidadIdOrderByDiaSemanaAsc(subespecialidadId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubespecialidadHorarioResponseDTO buscarPorId(UUID id) {
        return mapToDTO(obtener(id));
    }

    @Transactional
    public SubespecialidadHorarioResponseDTO crear(SubespecialidadHorarioRequestDTO dto) {
        validarHoras(dto);
        Subespecialidad sub = buscarSubespecialidad(dto.getSubespecialidadId());

        if (horarioRepository.existsBySubespecialidadIdAndDiaSemana(sub.getId(), dto.getDiaSemana())) {
            throw new BusinessException("La subespecialidad " + sub.getNombre()
                    + " ya tiene un horario para el " + nombreDia(dto.getDiaSemana()) + ".");
        }

        int duracion = (dto.getDuracionConsultaMinutos() != null) ? dto.getDuracionConsultaMinutos() : 35;

        SubespecialidadHorario guardado = horarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(sub)
                .diaSemana(dto.getDiaSemana())
                .horaInicio(dto.getHoraInicio())
                .horaFin(dto.getHoraFin())
                .capacidadMaxima(dto.getCapacidadMaxima())
                .duracionConsultaMinutos(duracion)
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .actualizadoEn(OffsetDateTime.now())
                .build());

        publicarAuditoria("crear", guardado);
        log.info("Horario por subespecialidad creado: {} {} ({}-{})",
                sub.getNombre(), nombreDia(dto.getDiaSemana()), dto.getHoraInicio(), dto.getHoraFin());
        return mapToDTO(guardado);
    }

    @Transactional
    public SubespecialidadHorarioResponseDTO actualizar(UUID id, SubespecialidadHorarioRequestDTO dto) {
        validarHoras(dto);
        SubespecialidadHorario horario = obtener(id);
        Subespecialidad sub = buscarSubespecialidad(dto.getSubespecialidadId());

        if (horarioRepository.existsBySubespecialidadIdAndDiaSemanaAndIdNot(sub.getId(), dto.getDiaSemana(), id)) {
            throw new BusinessException("La subespecialidad " + sub.getNombre()
                    + " ya tiene un horario para el " + nombreDia(dto.getDiaSemana()) + ".");
        }

        horario.setSubespecialidad(sub);
        horario.setDiaSemana(dto.getDiaSemana());
        horario.setHoraInicio(dto.getHoraInicio());
        horario.setHoraFin(dto.getHoraFin());
        horario.setCapacidadMaxima(dto.getCapacidadMaxima());
        if (dto.getDuracionConsultaMinutos() != null) {
            horario.setDuracionConsultaMinutos(dto.getDuracionConsultaMinutos());
        }
        horario.setActualizadoEn(OffsetDateTime.now());

        SubespecialidadHorario guardado = horarioRepository.save(horario);
        publicarAuditoria("actualizar", guardado);
        return mapToDTO(guardado);
    }

    @Transactional
    public SubespecialidadHorarioResponseDTO reactivar(UUID id) {
        return cambiarEstado(id, true);
    }

    @Transactional
    public SubespecialidadHorarioResponseDTO desactivar(UUID id) {
        return cambiarEstado(id, false);
    }

    @Transactional
    public SubespecialidadHorarioResponseDTO cambiarEstado(UUID id, boolean activo) {
        SubespecialidadHorario horario = obtener(id);
        if (Boolean.valueOf(activo).equals(horario.getActivo())) {
            return mapToDTO(horario);
        }
        horario.setActivo(activo);
        horario.setActualizadoEn(OffsetDateTime.now());
        SubespecialidadHorario guardado = horarioRepository.save(horario);
        publicarAuditoria(activo ? "reactivar" : "desactivar", guardado);
        return mapToDTO(guardado);
    }

    private void validarHoras(SubespecialidadHorarioRequestDTO dto) {
        if (!dto.getHoraFin().isAfter(dto.getHoraInicio())) {
            throw new BusinessException("La hora de fin debe ser posterior a la hora de inicio");
        }
    }

    private Subespecialidad buscarSubespecialidad(Long id) {
        Subespecialidad sub = subespecialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", id));
        if (!Boolean.TRUE.equals(sub.getActivo())) {
            throw new BusinessException("La subespecialidad " + sub.getNombre() + " está inactiva.");
        }
        return sub;
    }

    private SubespecialidadHorario obtener(UUID id) {
        return horarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SubespecialidadHorario", "id", id));
    }

    private void publicarAuditoria(String accion, SubespecialidadHorario horario) {
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("subespecialidad_horario")
                .entidadId(horario.getId())
                .accion(accion)
                .valoresNuevos(horario)
                .build());
    }

    private String nombreDia(Short dia) {
        return (dia != null && dia >= 1 && dia <= 7) ? DIAS[dia - 1] : "Desconocido";
    }

    private SubespecialidadHorarioResponseDTO mapToDTO(SubespecialidadHorario h) {
        var sub = h.getSubespecialidad();
        return SubespecialidadHorarioResponseDTO.builder()
                .id(h.getId())
                .subespecialidadId(sub.getId())
                .subespecialidadNombre(sub.getNombre())
                .especialidadId(sub.getEspecialidad() != null ? sub.getEspecialidad().getId() : null)
                .especialidadNombre(sub.getEspecialidad() != null ? sub.getEspecialidad().getNombre() : null)
                .diaSemana(h.getDiaSemana())
                .diaSemanaNombre(nombreDia(h.getDiaSemana()))
                .horaInicio(h.getHoraInicio())
                .horaFin(h.getHoraFin())
                .capacidadMaxima(h.getCapacidadMaxima())
                .duracionConsultaMinutos(h.getDuracionConsultaMinutos())
                .activo(h.getActivo())
                .build();
    }
}
