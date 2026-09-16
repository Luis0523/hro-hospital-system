package com.hro.system.medico.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.clinica.entity.Clinica;
import com.hro.system.clinica.repository.ClinicaRepository;
import com.hro.system.medico.dto.AsignarMedicoClinicaRequestDTO;
import com.hro.system.medico.dto.MedicoClinicaResponseDTO;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.entity.MedicoClinica;
import com.hro.system.medico.repository.MedicoClinicaRepository;
import com.hro.system.medico.repository.MedicoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicoClinicaService {

    private final MedicoClinicaRepository medicoClinicaRepository;
    private final MedicoRepository medicoRepository;
    private final ClinicaRepository clinicaRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final String[] DIAS = {
            "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
    };

    @Transactional
    public MedicoClinicaResponseDTO asignarHorario(AsignarMedicoClinicaRequestDTO dto) {
        if (!dto.getHoraFin().isAfter(dto.getHoraInicio())) {
            throw new BusinessException("La hora de fin debe ser posterior a la hora de inicio");
        }

        int duracion = (dto.getDuracionConsultaMinutos() != null) ? dto.getDuracionConsultaMinutos() : 35;

        // La agenda debe caber dentro de la jornada para que las horas escalonadas no se desborden
        // ni choquen con el final del horario del médico.
        long minutosJornada = java.time.Duration.between(dto.getHoraInicio(), dto.getHoraFin()).toMinutes();
        long minutosRequeridos = (long) dto.getCapacidadMaxima() * duracion;
        if (minutosRequeridos > minutosJornada) {
            throw new BusinessException(String.format(
                    "La capacidad configurada no cabe en la jornada: %d pacientes x %d min = %d min, "
                            + "pero el horario %s-%s solo dispone de %d min. Reduzca la capacidad, "
                            + "la duración de consulta o amplíe el horario.",
                    dto.getCapacidadMaxima(), duracion, minutosRequeridos,
                    dto.getHoraInicio(), dto.getHoraFin(), minutosJornada));
        }

        Medico medico = medicoRepository.findById(dto.getMedicoId())
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "id", dto.getMedicoId()));

        Clinica clinica = clinicaRepository.findById(dto.getClinicaId())
                .orElseThrow(() -> new ResourceNotFoundException("Clinica", "id", dto.getClinicaId()));

        if (medicoClinicaRepository.findByMedicoIdAndClinicaIdAndDiaSemana(dto.getMedicoId(), dto.getClinicaId(), dto.getDiaSemana()).isPresent()) {
            throw new BusinessException("El médico ya tiene asignado un horario en esta clínica para el día " + obtenerNombreDia(dto.getDiaSemana()));
        }

        MedicoClinica mc = MedicoClinica.builder()
                .medico(medico)
                .clinica(clinica)
                .diaSemana(dto.getDiaSemana())
                .horaInicio(dto.getHoraInicio())
                .horaFin(dto.getHoraFin())
                .capacidadMaxima(dto.getCapacidadMaxima())
                .duracionConsultaMinutos(duracion)
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        MedicoClinica guardado = medicoClinicaRepository.save(mc);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("medico_clinica")
                .entidadId(guardado.getId())
                .accion("crear")
                .valoresNuevos(guardado)
                .build());

        log.info("Horario asignado para Dr. {} en clínica {} ({}, {}-{})",
                medico.getNombres(), clinica.getNombre(), obtenerNombreDia(dto.getDiaSemana()), dto.getHoraInicio(), dto.getHoraFin());

        return mapToDTO(guardado);
    }

    @Transactional
    public void cambiarEstado(Long id, boolean activo) {
        MedicoClinica mc = medicoClinicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicoClinica", "id", id));
        mc.setActivo(activo);
        medicoClinicaRepository.save(mc);
    }

    @Transactional(readOnly = true)
    public List<MedicoClinicaResponseDTO> listarPorClinica(Long clinicaId) {
        return medicoClinicaRepository.findByClinicaIdAndActivoTrue(clinicaId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicoClinicaResponseDTO> listarPorMedico(Long medicoId) {
        return medicoClinicaRepository.findByMedicoIdAndActivoTrue(medicoId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicoClinicaResponseDTO> listarPorClinicaYDia(Long clinicaId, Short diaSemana) {
        return medicoClinicaRepository.findByClinicaIdAndDiaSemanaAndActivoTrue(clinicaId, diaSemana).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicoClinicaResponseDTO buscarPorId(Long id) {
        MedicoClinica mc = medicoClinicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MedicoClinica", "id", id));
        return mapToDTO(mc);
    }

    private String obtenerNombreDia(Short dia) {
        if (dia != null && dia >= 1 && dia <= 7) {
            return DIAS[dia - 1];
        }
        return "Desconocido";
    }

    private MedicoClinicaResponseDTO mapToDTO(MedicoClinica mc) {
        return MedicoClinicaResponseDTO.builder()
                .id(mc.getId())
                .medicoId(mc.getMedico().getId())
                .medicoNombre(mc.getMedico().getNombres())
                .numeroColegiado(mc.getMedico().getNumeroColegiado())
                .clinicaId(mc.getClinica().getId())
                .clinicaNombre(mc.getClinica().getNombre())
                .subespecialidadNombre(mc.getClinica().getSubespecialidad().getNombre())
                .especialidadNombre(mc.getClinica().getSubespecialidad().getEspecialidad().getNombre())
                .diaSemana(mc.getDiaSemana())
                .diaSemanaNombre(obtenerNombreDia(mc.getDiaSemana()))
                .horaInicio(mc.getHoraInicio())
                .horaFin(mc.getHoraFin())
                .capacidadMaxima(mc.getCapacidadMaxima())
                .duracionConsultaMinutos(mc.getDuracionConsultaMinutos())
                .activo(mc.getActivo())
                .creadoEn(mc.getCreadoEn())
                .build();
    }
}
