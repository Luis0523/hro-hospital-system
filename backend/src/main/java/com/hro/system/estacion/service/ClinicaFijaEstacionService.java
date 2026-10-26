package com.hro.system.estacion.service;

import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.estacion.dto.AsignarClinicasFijasRequestDTO;
import com.hro.system.estacion.dto.ClinicaFijaEstacionRequestDTO;
import com.hro.system.estacion.dto.ClinicaFijaEstacionResponseDTO;
import com.hro.system.estacion.entity.ClinicaFijaEstacion;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.ClinicaFijaEstacionRepository;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.estacion.repository.EstacionSubespecialidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClinicaFijaEstacionService {

    private final ClinicaFijaEstacionRepository repository;
    private final EstacionEnfermeriaRepository estacionRepository;
    private final EstacionSubespecialidadRepository estacionSubespecialidadRepository;
    private final EspacioFisicoRepository espacioFisicoRepository;
    private final EspecialidadRepository especialidadRepository;

    @Transactional(readOnly = true)
    public List<ClinicaFijaEstacionResponseDTO> listar(Long estacionId) {
        estacionActiva(estacionId);
        return repository.findByEstacionIdAndActivoTrueOrderByIdAsc(estacionId)
                .stream().map(this::map).toList();
    }

    @Transactional
    public List<ClinicaFijaEstacionResponseDTO> reemplazar(
            Long estacionId, AsignarClinicasFijasRequestDTO dto) {
        EstacionEnfermeria estacion = estacionActiva(estacionId);
        Set<Long> especialidadesValidas = new HashSet<>();
        estacionSubespecialidadRepository.findByEstacionIdAndActivoTrue(estacion.getId())
                .forEach(config -> {
                    if (config.getSubespecialidad() != null
                            && config.getSubespecialidad().getEspecialidad() != null) {
                        especialidadesValidas.add(config.getSubespecialidad().getEspecialidad().getId());
                    }
                });

        repository.deleteByEstacionId(estacion.getId());
        repository.flush();
        if (dto != null && dto.getAsignaciones() != null) {
            for (ClinicaFijaEstacionRequestDTO item : dto.getAsignaciones()) {
                if (!especialidadesValidas.contains(item.getEspecialidadId())) {
                    throw new BusinessException("ESPECIALIDAD_FUERA_ESTACION",
                            "La especialidad no pertenece a la estación seleccionada");
                }
                Especialidad especialidad = especialidadRepository.findById(item.getEspecialidadId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Especialidad", "id", item.getEspecialidadId()));
                EspacioFisico espacio = espacioFisicoRepository.findById(item.getEspacioFisicoId())
                        .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "EspacioFisico", "id", item.getEspacioFisicoId()));
                repository.save(ClinicaFijaEstacion.builder()
                        .estacion(estacion)
                        .especialidad(especialidad)
                        .espacioFisico(espacio)
                        .activo(true)
                        .creadoEn(OffsetDateTime.now())
                        .actualizadoEn(OffsetDateTime.now())
                        .build());
            }
        }
        return listar(estacion.getId());
    }

    private EstacionEnfermeria estacionActiva(Long estacionId) {
        return estacionRepository.findById(estacionId)
                .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "EstacionEnfermeria", "id", estacionId));
    }

    private ClinicaFijaEstacionResponseDTO map(ClinicaFijaEstacion item) {
        EspacioFisico espacio = item.getEspacioFisico();
        return ClinicaFijaEstacionResponseDTO.builder()
                .id(item.getId())
                .estacionId(item.getEstacion() != null ? item.getEstacion().getId() : null)
                .especialidadId(item.getEspecialidad() != null ? item.getEspecialidad().getId() : null)
                .especialidadNombre(item.getEspecialidad() != null
                        ? item.getEspecialidad().getNombre() : null)
                .espacioFisicoId(espacio != null ? espacio.getId() : null)
                .espacioNumero(espacio != null ? espacio.getNumero() : null)
                .espacioNombre(espacio != null ? espacio.getNombre() : null)
                .nivel(espacio != null ? espacio.getNivel() : null)
                .build();
    }
}
