package com.hro.system.medico.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.medico.dto.ActualizarMedicoSubespecialidadRequestDTO;
import com.hro.system.medico.dto.AsignarMedicoSubespecialidadRequestDTO;
import com.hro.system.medico.dto.MedicoSubespecialidadResponseDTO;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.entity.MedicoSubespecialidad;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.medico.repository.MedicoSubespecialidadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Programación médica por subespecialidad (día, horario y capacidad), independiente
 * de la sala física donde se atienda.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicoSubespecialidadService {

    private final MedicoSubespecialidadRepository medicoSubespecialidadRepository;
    private final MedicoRepository medicoRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final String[] DIAS = {
            "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
    };

    @Transactional
    public MedicoSubespecialidadResponseDTO asignarHorario(AsignarMedicoSubespecialidadRequestDTO dto) {
        int duracion = validarHorario(dto.getHoraInicio(), dto.getHoraFin(),
                dto.getCapacidadMaxima(), dto.getDuracionConsultaMinutos());

        Medico medico = medicoRepository.findById(dto.getMedicoId())
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "id", dto.getMedicoId()));
        if (!Boolean.TRUE.equals(medico.getActivo())) {
            throw new BusinessException("El médico " + medico.getNombres() + " está inactivo.");
        }

        Subespecialidad sub = subespecialidadRepository.findById(dto.getSubespecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", dto.getSubespecialidadId()));
        if (!Boolean.TRUE.equals(sub.getActivo())) {
            throw new BusinessException("La subespecialidad " + sub.getNombre() + " está inactiva.");
        }

        if (medicoSubespecialidadRepository
                .findByMedicoIdAndSubespecialidadIdAndDiaSemana(dto.getMedicoId(), dto.getSubespecialidadId(), dto.getDiaSemana())
                .isPresent()) {
            throw new BusinessException("El médico ya tiene asignado un horario en esta subespecialidad para el día " + obtenerNombreDia(dto.getDiaSemana()));
        }

        validarSinSolapamiento(dto.getMedicoId(), dto.getDiaSemana(), dto.getHoraInicio(), dto.getHoraFin(), null);

        MedicoSubespecialidad ms = MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(sub)
                .diaSemana(dto.getDiaSemana())
                .horaInicio(dto.getHoraInicio())
                .horaFin(dto.getHoraFin())
                .capacidadMaxima(dto.getCapacidadMaxima())
                .duracionConsultaMinutos(duracion)
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        MedicoSubespecialidad guardado = medicoSubespecialidadRepository.save(ms);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("medico_subespecialidad")
                .entidadId(guardado.getId())
                .accion("crear")
                .valoresNuevos(guardado)
                .build());

        log.info("Horario asignado para Dr. {} en {} ({}, {}-{})",
                medico.getNombres(), sub.getNombre(), obtenerNombreDia(dto.getDiaSemana()), dto.getHoraInicio(), dto.getHoraFin());

        return mapToDTO(guardado);
    }

    @Transactional
    public MedicoSubespecialidadResponseDTO actualizarHorario(UUID id, ActualizarMedicoSubespecialidadRequestDTO dto) {
        MedicoSubespecialidad ms = medicoSubespecialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicoSubespecialidad", "id", id));

        int duracion = (dto.getDuracionConsultaMinutos() != null)
                ? dto.getDuracionConsultaMinutos()
                : ms.getDuracionConsultaMinutos();
        validarHorario(dto.getHoraInicio(), dto.getHoraFin(), dto.getCapacidadMaxima(), duracion);
        validarSinSolapamiento(ms.getMedico().getId(), ms.getDiaSemana(),
                dto.getHoraInicio(), dto.getHoraFin(), id);

        ms.setHoraInicio(dto.getHoraInicio());
        ms.setHoraFin(dto.getHoraFin());
        ms.setCapacidadMaxima(dto.getCapacidadMaxima());
        ms.setDuracionConsultaMinutos(duracion);

        MedicoSubespecialidad actualizado = medicoSubespecialidadRepository.save(ms);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("medico_subespecialidad")
                .entidadId(actualizado.getId())
                .accion("actualizar")
                .valoresNuevos(actualizado)
                .build());

        log.info("Programación actualizada: Dr. {} en {} ({}, {}-{})",
                ms.getMedico().getNombres(), ms.getSubespecialidad().getNombre(),
                obtenerNombreDia(ms.getDiaSemana()), dto.getHoraInicio(), dto.getHoraFin());

        return mapToDTO(actualizado);
    }

    @Transactional
    public MedicoSubespecialidadResponseDTO cambiarEstado(UUID id, boolean activo) {
        MedicoSubespecialidad ms = medicoSubespecialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicoSubespecialidad", "id", id));

        if (Boolean.valueOf(activo).equals(ms.getActivo())) {
            return mapToDTO(ms);
        }

        if (activo) {
            if (!Boolean.TRUE.equals(ms.getMedico().getActivo())) {
                throw new BusinessException("No se puede reactivar: el médico " + ms.getMedico().getNombres() + " está inactivo.");
            }
            if (!Boolean.TRUE.equals(ms.getSubespecialidad().getActivo())) {
                throw new BusinessException("No se puede reactivar: la subespecialidad " + ms.getSubespecialidad().getNombre() + " está inactiva.");
            }
            validarSinSolapamiento(ms.getMedico().getId(), ms.getDiaSemana(), ms.getHoraInicio(), ms.getHoraFin(), id);
        }

        ms.setActivo(activo);
        MedicoSubespecialidad guardado = medicoSubespecialidadRepository.save(ms);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("medico_subespecialidad")
                .entidadId(guardado.getId())
                .accion(activo ? "reactivar" : "desactivar")
                .valoresNuevos(guardado)
                .build());

        log.info("Programación Dr. {} ({}) {}",
                ms.getMedico().getNombres(), obtenerNombreDia(ms.getDiaSemana()), activo ? "reactivada" : "desactivada");
        return mapToDTO(guardado);
    }

    @Transactional
    public MedicoSubespecialidadResponseDTO reactivar(UUID id) {
        return cambiarEstado(id, true);
    }

    @Transactional(readOnly = true)
    public List<MedicoSubespecialidadResponseDTO> listarConFiltros(UUID medicoId, Long subespecialidadId,
                                                                  Short diaSemana, Boolean activo) {
        return medicoSubespecialidadRepository.buscarPorFiltros(medicoId, subespecialidadId, diaSemana, activo).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicoSubespecialidadResponseDTO> listarPorSubespecialidad(Long subespecialidadId) {
        return medicoSubespecialidadRepository.findBySubespecialidadIdAndActivoTrue(subespecialidadId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicoSubespecialidadResponseDTO> listarPorMedico(UUID medicoId) {
        return medicoSubespecialidadRepository.findByMedicoIdAndActivoTrue(medicoId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicoSubespecialidadResponseDTO> listarPorSubespecialidadYDia(Long subespecialidadId, Short diaSemana) {
        return medicoSubespecialidadRepository.findBySubespecialidadIdAndDiaSemanaAndActivoTrue(subespecialidadId, diaSemana).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicoSubespecialidadResponseDTO buscarPorId(UUID id) {
        return mapToDTO(medicoSubespecialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicoSubespecialidad", "id", id)));
    }

    private int validarHorario(LocalTime horaInicio, LocalTime horaFin, Integer capacidadMaxima, Integer duracionSolicitada) {
        if (!horaFin.isAfter(horaInicio)) {
            throw new BusinessException("La hora de fin debe ser posterior a la hora de inicio");
        }

        int duracion = (duracionSolicitada != null) ? duracionSolicitada : 35;
        long minutosJornada = Duration.between(horaInicio, horaFin).toMinutes();
        long minutosRequeridos = (long) capacidadMaxima * duracion;
        if (minutosRequeridos > minutosJornada) {
            throw new BusinessException(String.format(
                    "La capacidad configurada no cabe en la jornada: %d pacientes x %d min = %d min, "
                            + "pero el horario %s-%s solo dispone de %d min. Reduzca la capacidad, "
                            + "la duración de consulta o amplíe el horario.",
                    capacidadMaxima, duracion, minutosRequeridos, horaInicio, horaFin, minutosJornada));
        }
        return duracion;
    }

    private void validarSinSolapamiento(UUID medicoId, Short diaSemana, LocalTime horaInicio,
                                        LocalTime horaFin, UUID idExcluido) {
        boolean solapa = medicoSubespecialidadRepository
                .findByMedicoIdAndDiaSemanaAndActivoTrue(medicoId, diaSemana).stream()
                .filter(ms -> idExcluido == null || !ms.getId().equals(idExcluido))
                .anyMatch(ms -> ms.getHoraInicio().isBefore(horaFin) && horaInicio.isBefore(ms.getHoraFin()));
        if (solapa) {
            throw new BusinessException("El médico ya tiene una programación activa que se superpone el "
                    + obtenerNombreDia(diaSemana) + " en el horario indicado.");
        }
    }

    private String obtenerNombreDia(Short dia) {
        if (dia != null && dia >= 1 && dia <= 7) {
            return DIAS[dia - 1];
        }
        return "Desconocido";
    }

    private MedicoSubespecialidadResponseDTO mapToDTO(MedicoSubespecialidad ms) {
        return MedicoSubespecialidadResponseDTO.builder()
                .id(ms.getId())
                .medicoId(ms.getMedico().getId())
                .medicoNombre(ms.getMedico().getNombres())
                .numeroColegiado(ms.getMedico().getNumeroColegiado())
                .subespecialidadId(ms.getSubespecialidad().getId())
                .subespecialidadNombre(ms.getSubespecialidad().getNombre())
                .especialidadId(ms.getSubespecialidad().getEspecialidad().getId())
                .especialidadNombre(ms.getSubespecialidad().getEspecialidad().getNombre())
                .diaSemana(ms.getDiaSemana())
                .diaSemanaNombre(obtenerNombreDia(ms.getDiaSemana()))
                .horaInicio(ms.getHoraInicio())
                .horaFin(ms.getHoraFin())
                .capacidadMaxima(ms.getCapacidadMaxima())
                .duracionConsultaMinutos(ms.getDuracionConsultaMinutos())
                .activo(ms.getActivo())
                .creadoEn(ms.getCreadoEn())
                .build();
    }
}
