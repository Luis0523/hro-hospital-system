package com.hro.system.clinica.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.clinica.dto.CrearSubespecialidadRequestDTO;
import com.hro.system.clinica.dto.SubespecialidadResponseDTO;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
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
public class SubespecialidadService {

    private final SubespecialidadRepository subespecialidadRepository;
    private final EspecialidadRepository especialidadRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public SubespecialidadResponseDTO crearSubespecialidad(CrearSubespecialidadRequestDTO dto) {
        Especialidad esp = especialidadRepository.findById(dto.getEspecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad", "id", dto.getEspecialidadId()));

        if (subespecialidadRepository.findByEspecialidadIdAndNombreIgnoreCase(dto.getEspecialidadId(), dto.getNombre().trim()).isPresent()) {
            throw new BusinessException("Ya existe la subespecialidad '" + dto.getNombre() + "' para la especialidad '" + esp.getNombre() + "'");
        }

        Subespecialidad sub = Subespecialidad.builder()
                .especialidad(esp)
                .nombre(dto.getNombre().trim())
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        Subespecialidad guardada = subespecialidadRepository.save(sub);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("subespecialidad")
                .entidadId(guardada.getId())
                .accion("crear")
                .valoresNuevos(guardada)
                .build());

        log.info("Subespecialidad creada: {} (Especialidad: {})", guardada.getNombre(), esp.getNombre());
        return mapToDTO(guardada);
    }

    @Transactional
    public SubespecialidadResponseDTO actualizarSubespecialidad(Long id, CrearSubespecialidadRequestDTO dto) {
        Subespecialidad sub = subespecialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", id));

        Especialidad esp = especialidadRepository.findById(dto.getEspecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad", "id", dto.getEspecialidadId()));

        if (subespecialidadRepository.existsByEspecialidadIdAndNombreIgnoreCaseAndIdNot(dto.getEspecialidadId(), dto.getNombre().trim(), id)) {
            throw new BusinessException("Ya existe otra subespecialidad con el nombre '" + dto.getNombre() + "' en esta especialidad");
        }

        sub.setEspecialidad(esp);
        sub.setNombre(dto.getNombre().trim());
        Subespecialidad actualizada = subespecialidadRepository.save(sub);
        return mapToDTO(actualizada);
    }

    @Transactional
    public SubespecialidadResponseDTO cambiarEstado(Long id, boolean activo) {
        Subespecialidad sub = subespecialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", id));

        if (activo && !Boolean.TRUE.equals(sub.getEspecialidad().getActivo())) {
            throw new BusinessException("No se puede reactivar la subespecialidad porque su especialidad padre está inactiva");
        }

        if (Boolean.valueOf(activo).equals(sub.getActivo())) {
            return mapToDTO(sub);
        }

        sub.setActivo(activo);
        Subespecialidad guardada = subespecialidadRepository.save(sub);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("subespecialidad")
                .entidadId(guardada.getId())
                .accion(activo ? "reactivar" : "desactivar")
                .valoresNuevos(guardada)
                .build());

        log.info("Subespecialidad {} {}", guardada.getNombre(), activo ? "reactivada" : "desactivada");
        return mapToDTO(guardada);
    }

    @Transactional
    public SubespecialidadResponseDTO reactivar(Long id) {
        return cambiarEstado(id, true);
    }

    @Transactional(readOnly = true)
    public List<SubespecialidadResponseDTO> listarPorEspecialidad(Long especialidadId, Boolean activo) {
        List<Subespecialidad> resultado = (activo == null)
                ? subespecialidadRepository.findByEspecialidadId(especialidadId)
                : subespecialidadRepository.findByEspecialidadIdAndActivo(especialidadId, activo);
        return resultado.stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubespecialidadResponseDTO> listarTodasActivas() {
        return subespecialidadRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubespecialidadResponseDTO> listarPorEstado(Boolean activo) {
        if (activo == null) {
            return subespecialidadRepository.findAll().stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        return subespecialidadRepository.findByActivo(activo).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubespecialidadResponseDTO buscarPorId(Long id) {
        Subespecialidad sub = subespecialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", id));
        return mapToDTO(sub);
    }

    private SubespecialidadResponseDTO mapToDTO(Subespecialidad sub) {
        return SubespecialidadResponseDTO.builder()
                .id(sub.getId())
                .especialidadId(sub.getEspecialidad().getId())
                .especialidadNombre(sub.getEspecialidad().getNombre())
                .nombre(sub.getNombre())
                .activo(sub.getActivo())
                .creadoEn(sub.getCreadoEn())
                .build();
    }
}
