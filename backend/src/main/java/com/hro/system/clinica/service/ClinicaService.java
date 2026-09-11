package com.hro.system.clinica.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.clinica.dto.ActualizarClinicaRequestDTO;
import com.hro.system.clinica.dto.CrearClinicaRequestDTO;
import com.hro.system.clinica.dto.ClinicaResponseDTO;
import com.hro.system.clinica.entity.Clinica;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.ClinicaRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
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
public class ClinicaService {

    private final ClinicaRepository clinicaRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ClinicaResponseDTO crearClinica(CrearClinicaRequestDTO dto) {
        Subespecialidad sub = subespecialidadRepository.findById(dto.getSubespecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", dto.getSubespecialidadId()));

        Clinica clinica = Clinica.builder()
                .subespecialidad(sub)
                .nombre(dto.getNombre().trim())
                .ubicacion(dto.getUbicacion() != null ? dto.getUbicacion().trim() : null)
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        Clinica guardada = clinicaRepository.save(clinica);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("clinica")
                .entidadId(guardada.getId())
                .accion("crear")
                .valoresNuevos(guardada)
                .build());

        log.info("Clínica creada: {} (Ubicación: {})", guardada.getNombre(), guardada.getUbicacion());
        return mapToDTO(guardada);
    }

    @Transactional
    public ClinicaResponseDTO actualizarClinica(Long id, ActualizarClinicaRequestDTO dto) {
        Clinica clinica = clinicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinica", "id", id));

        Subespecialidad sub = subespecialidadRepository.findById(dto.getSubespecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", dto.getSubespecialidadId()));

        clinica.setSubespecialidad(sub);
        clinica.setNombre(dto.getNombre().trim());
        clinica.setUbicacion(dto.getUbicacion() != null ? dto.getUbicacion().trim() : null);
        clinica.setActivo(dto.getActivo());

        Clinica actualizada = clinicaRepository.save(clinica);
        return mapToDTO(actualizada);
    }

    @Transactional
    public void cambiarEstado(Long id, boolean activo) {
        Clinica clinica = clinicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinica", "id", id));
        clinica.setActivo(activo);
        clinicaRepository.save(clinica);
    }

    @Transactional(readOnly = true)
    public List<ClinicaResponseDTO> listarActivas() {
        return clinicaRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClinicaResponseDTO> listarPorSubespecialidad(Long subespecialidadId) {
        return clinicaRepository.findBySubespecialidadIdAndActivoTrue(subespecialidadId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClinicaResponseDTO> listarPorEspecialidad(Long especialidadId) {
        return clinicaRepository.findByEspecialidadIdAndActivoTrue(especialidadId).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClinicaResponseDTO buscarPorId(Long id) {
        Clinica clinica = clinicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Clinica", "id", id));
        return mapToDTO(clinica);
    }

    private ClinicaResponseDTO mapToDTO(Clinica c) {
        return ClinicaResponseDTO.builder()
                .id(c.getId())
                .subespecialidadId(c.getSubespecialidad().getId())
                .subespecialidadNombre(c.getSubespecialidad().getNombre())
                .especialidadId(c.getSubespecialidad().getEspecialidad().getId())
                .especialidadNombre(c.getSubespecialidad().getEspecialidad().getNombre())
                .nombre(c.getNombre())
                .ubicacion(c.getUbicacion())
                .activo(c.getActivo())
                .creadoEn(c.getCreadoEn())
                .build();
    }
}
