package com.hro.system.espacio.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.espacio.dto.ActualizarEspacioFisicoRequestDTO;
import com.hro.system.espacio.dto.CrearEspacioFisicoRequestDTO;
import com.hro.system.espacio.dto.EspacioFisicoResponseDTO;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Gestión de espacios físicos (salas/consultorios). Ya no administra la especialidad:
 * esa se resuelve por día en {@link AsignacionDiariaEspacioService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EspacioFisicoService {

    private final EspacioFisicoRepository espacioFisicoRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public EspacioFisicoResponseDTO crear(CrearEspacioFisicoRequestDTO dto) {
        if (espacioFisicoRepository.findByNumero(dto.getNumero().trim()).isPresent()) {
            throw new BusinessException("Ya existe un espacio físico con el número " + dto.getNumero());
        }

        EspacioFisico espacio = EspacioFisico.builder()
                .numero(dto.getNumero().trim())
                .nivel(dto.getNivel())
                .capacidadCamillas(dto.getCapacidadCamillas() != null ? dto.getCapacidadCamillas() : 1)
                .coordenadasPlano(dto.getCoordenadasPlano())
                .nombre(dto.getNombre().trim())
                .ubicacion(dto.getUbicacion() != null ? dto.getUbicacion().trim() : null)
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        EspacioFisico guardado = espacioFisicoRepository.save(espacio);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("espacio_fisico")
                .entidadId(guardado.getId())
                .accion("crear")
                .valoresNuevos(guardado)
                .build());

        log.info("Espacio físico creado: Sala {} (Nivel {})", guardado.getNumero(), guardado.getNivel());
        return mapToDTO(guardado);
    }

    @Transactional
    public EspacioFisicoResponseDTO actualizar(UUID id, ActualizarEspacioFisicoRequestDTO dto) {
        EspacioFisico espacio = espacioFisicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", id));

        espacio.setNumero(dto.getNumero().trim());
        espacio.setNivel(dto.getNivel());
        if (dto.getCapacidadCamillas() != null) {
            espacio.setCapacidadCamillas(dto.getCapacidadCamillas());
        }
        espacio.setCoordenadasPlano(dto.getCoordenadasPlano());
        espacio.setNombre(dto.getNombre().trim());
        espacio.setUbicacion(dto.getUbicacion() != null ? dto.getUbicacion().trim() : null);
        espacio.setActivo(dto.getActivo());

        return mapToDTO(espacioFisicoRepository.save(espacio));
    }

    @Transactional
    public EspacioFisicoResponseDTO cambiarEstado(UUID id, boolean activo) {
        EspacioFisico espacio = espacioFisicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", id));

        if (Boolean.valueOf(activo).equals(espacio.getActivo())) {
            return mapToDTO(espacio);
        }

        espacio.setActivo(activo);
        EspacioFisico guardado = espacioFisicoRepository.save(espacio);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("espacio_fisico")
                .entidadId(guardado.getId())
                .accion(activo ? "reactivar" : "desactivar")
                .valoresNuevos(guardado)
                .build());

        log.info("Espacio físico {} {}", guardado.getNumero(), activo ? "reactivado" : "fuera de servicio");
        return mapToDTO(guardado);
    }

    @Transactional
    public EspacioFisicoResponseDTO reactivar(UUID id) {
        return cambiarEstado(id, true);
    }

    @Transactional(readOnly = true)
    public List<EspacioFisicoResponseDTO> listarActivos() {
        return espacioFisicoRepository.findByActivoTrue().stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<EspacioFisicoResponseDTO> listarPorEstado(Boolean activo) {
        if (activo == null) {
            return espacioFisicoRepository.findAll().stream().map(this::mapToDTO).toList();
        }
        return espacioFisicoRepository.findByActivo(activo).stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<EspacioFisicoResponseDTO> listarPorNivel(Short nivel, Boolean activo) {
        List<EspacioFisico> resultado = (activo == null)
                ? espacioFisicoRepository.findByNivel(nivel)
                : espacioFisicoRepository.findByNivelAndActivo(nivel, activo);
        return resultado.stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public EspacioFisicoResponseDTO buscarPorId(UUID id) {
        return mapToDTO(espacioFisicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", id)));
    }

    private EspacioFisicoResponseDTO mapToDTO(EspacioFisico e) {
        return EspacioFisicoResponseDTO.builder()
                .id(e.getId())
                .numero(e.getNumero())
                .nivel(e.getNivel())
                .capacidadCamillas(e.getCapacidadCamillas())
                .coordenadasPlano(e.getCoordenadasPlano())
                .nombre(e.getNombre())
                .ubicacion(e.getUbicacion())
                .activo(e.getActivo())
                .creadoEn(e.getCreadoEn())
                .build();
    }
}
