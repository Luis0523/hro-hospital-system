package com.hro.system.clinica.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.clinica.dto.CrearEspecialidadRequestDTO;
import com.hro.system.clinica.dto.EspecialidadResponseDTO;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
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
public class EspecialidadService {

    private final EspecialidadRepository especialidadRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public EspecialidadResponseDTO crearEspecialidad(CrearEspecialidadRequestDTO dto) {
        if (especialidadRepository.findByNombreIgnoreCase(dto.getNombre().trim()).isPresent()) {
            throw new BusinessException("Ya existe una especialidad con el nombre: " + dto.getNombre());
        }

        Especialidad esp = Especialidad.builder()
                .nombre(dto.getNombre().trim())
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        Especialidad guardada = especialidadRepository.save(esp);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("especialidad")
                .entidadId(guardada.getId())
                .accion("crear")
                .valoresNuevos(guardada)
                .build());

        log.info("Especialidad creada: {} con ID: {}", guardada.getNombre(), guardada.getId());
        return mapToDTO(guardada);
    }

    @Transactional
    public EspecialidadResponseDTO actualizarEspecialidad(Long id, CrearEspecialidadRequestDTO dto) {
        Especialidad esp = especialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad", "id", id));

        if (especialidadRepository.existsByNombreIgnoreCaseAndIdNot(dto.getNombre().trim(), id)) {
            throw new BusinessException("Ya existe otra especialidad con el nombre: " + dto.getNombre());
        }

        esp.setNombre(dto.getNombre().trim());
        Especialidad actualizada = especialidadRepository.save(esp);
        return mapToDTO(actualizada);
    }

    @Transactional
    public EspecialidadResponseDTO cambiarEstado(Long id, boolean activo) {
        Especialidad esp = especialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad", "id", id));

        if (Boolean.valueOf(activo).equals(esp.getActivo())) {
            return mapToDTO(esp);
        }

        esp.setActivo(activo);
        Especialidad guardada = especialidadRepository.save(esp);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("especialidad")
                .entidadId(guardada.getId())
                .accion(activo ? "reactivar" : "desactivar")
                .valoresNuevos(guardada)
                .build());

        log.info("Especialidad {} {}", guardada.getNombre(), activo ? "reactivada" : "desactivada");
        return mapToDTO(guardada);
    }

    @Transactional
    public EspecialidadResponseDTO reactivar(Long id) {
        return cambiarEstado(id, true);
    }

    @Transactional(readOnly = true)
    public List<EspecialidadResponseDTO> listarActivas() {
        return especialidadRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EspecialidadResponseDTO> listarTodas() {
        return especialidadRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EspecialidadResponseDTO> listarPorEstado(Boolean activo) {
        if (activo == null) {
            return listarTodas();
        }
        return especialidadRepository.findByActivo(activo).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public EspecialidadResponseDTO buscarPorId(Long id) {
        Especialidad esp = especialidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad", "id", id));
        return mapToDTO(esp);
    }

    private EspecialidadResponseDTO mapToDTO(Especialidad esp) {
        return EspecialidadResponseDTO.builder()
                .id(esp.getId())
                .nombre(esp.getNombre())
                .activo(esp.getActivo())
                .creadoEn(esp.getCreadoEn())
                .build();
    }
}
