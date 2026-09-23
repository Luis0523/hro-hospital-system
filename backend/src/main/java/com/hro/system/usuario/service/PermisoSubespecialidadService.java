package com.hro.system.usuario.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.usuario.dto.CrearPermisoRequestDTO;
import com.hro.system.usuario.dto.PermisoSubespecialidadResponseDTO;
import com.hro.system.usuario.entity.PermisoSubespecialidad;
import com.hro.system.usuario.entity.TipoPermiso;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.PermisoSubespecialidadRepository;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Administración de permisos de usuario sobre subespecialidades. La baja es lógica
 * ({@code activo = false}) para conservar historial y permitir reactivación.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermisoSubespecialidadService {

    private final PermisoSubespecialidadRepository permisoRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<PermisoSubespecialidadResponseDTO> listarPorUsuario(Long usuarioId, Boolean activo) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));

        List<PermisoSubespecialidad> permisos = (activo == null)
                ? permisoRepository.findByUsuarioReferenciaId(usuarioId)
                : permisoRepository.findByUsuarioReferenciaIdAndActivo(usuarioId, activo);
        return permisos.stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<PermisoSubespecialidadResponseDTO> listar(Long subespecialidadId, Boolean activo) {
        if (subespecialidadId != null) {
            return listarPorSubespecialidad(subespecialidadId, activo);
        }
        List<PermisoSubespecialidad> permisos = (activo == null)
                ? permisoRepository.findAll()
                : permisoRepository.findByActivo(activo);
        return permisos.stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<PermisoSubespecialidadResponseDTO> listarPorSubespecialidad(Long subespecialidadId, Boolean activo) {
        List<PermisoSubespecialidad> permisos = (activo == null)
                ? permisoRepository.findBySubespecialidadId(subespecialidadId)
                : permisoRepository.findBySubespecialidadIdAndActivo(subespecialidadId, activo);
        return permisos.stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public PermisoSubespecialidadResponseDTO buscarPorId(Long id) {
        return mapToDTO(obtener(id));
    }

    @Transactional
    public PermisoSubespecialidadResponseDTO asignar(CrearPermisoRequestDTO dto) {
        TipoPermiso tipo = TipoPermiso.from(dto.getTipoPermiso());

        UsuarioReferencia usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", dto.getUsuarioId()));
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new BusinessException("El usuario " + usuario.getNombreMostrar() + " está inactivo.");
        }

        Subespecialidad sub = subespecialidadRepository.findById(dto.getSubespecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", dto.getSubespecialidadId()));
        if (!Boolean.TRUE.equals(sub.getActivo())) {
            throw new BusinessException("La subespecialidad " + sub.getNombre() + " está inactiva.");
        }

        Optional<PermisoSubespecialidad> existente = permisoRepository
                .findByUsuarioReferenciaIdAndSubespecialidadIdAndTipoPermiso(
                        usuario.getId(), sub.getId(), tipo.getValor());

        if (existente.isPresent()) {
            PermisoSubespecialidad permiso = existente.get();
            if (Boolean.TRUE.equals(permiso.getActivo())) {
                throw new BusinessException("El usuario ya tiene el permiso '" + tipo.getValor()
                        + "' sobre la subespecialidad " + sub.getNombre() + ".");
            }
            permiso.setActivo(true);
            PermisoSubespecialidad reactivado = permisoRepository.save(permiso);
            publicarAuditoria(reactivado, "reactivar");
            log.info("Permiso reactivado: usuario {} - {} - {}", usuario.getIdExterno(), sub.getNombre(), tipo.getValor());
            return mapToDTO(reactivado);
        }

        PermisoSubespecialidad permiso = PermisoSubespecialidad.builder()
                .usuarioReferencia(usuario)
                .subespecialidad(sub)
                .tipoPermiso(tipo.getValor())
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        PermisoSubespecialidad guardado = permisoRepository.save(permiso);
        publicarAuditoria(guardado, "crear");
        log.info("Permiso asignado: usuario {} - {} - {}", usuario.getIdExterno(), sub.getNombre(), tipo.getValor());
        return mapToDTO(guardado);
    }

    @Transactional
    public PermisoSubespecialidadResponseDTO activar(Long id) {
        return cambiarEstado(id, true);
    }

    @Transactional
    public PermisoSubespecialidadResponseDTO desactivar(Long id) {
        return cambiarEstado(id, false);
    }

    @Transactional
    public PermisoSubespecialidadResponseDTO cambiarEstado(Long id, boolean activo) {
        PermisoSubespecialidad permiso = obtener(id);
        if (Boolean.valueOf(activo).equals(permiso.getActivo())) {
            return mapToDTO(permiso);
        }

        if (activo) {
            if (!Boolean.TRUE.equals(permiso.getUsuarioReferencia().getActivo())) {
                throw new BusinessException("No se puede reactivar el permiso: el usuario está inactivo.");
            }
            if (!Boolean.TRUE.equals(permiso.getSubespecialidad().getActivo())) {
                throw new BusinessException("No se puede reactivar el permiso: la subespecialidad está inactiva.");
            }
        }

        permiso.setActivo(activo);
        PermisoSubespecialidad guardado = permisoRepository.save(permiso);
        publicarAuditoria(guardado, activo ? "reactivar" : "desactivar");
        return mapToDTO(guardado);
    }

    private PermisoSubespecialidad obtener(Long id) {
        return permisoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PermisoSubespecialidad", "id", id));
    }

    private void publicarAuditoria(PermisoSubespecialidad permiso, String accion) {
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("permiso_subespecialidad")
                .entidadId(permiso.getId())
                .accion(accion)
                .valoresNuevos(permiso)
                .build());
    }

    private PermisoSubespecialidadResponseDTO mapToDTO(PermisoSubespecialidad p) {
        Subespecialidad sub = p.getSubespecialidad();
        return PermisoSubespecialidadResponseDTO.builder()
                .id(p.getId())
                .usuarioId(p.getUsuarioReferencia().getId())
                .usuarioNombre(p.getUsuarioReferencia().getNombreMostrar())
                .subespecialidadId(sub.getId())
                .subespecialidadNombre(sub.getNombre())
                .especialidadId(sub.getEspecialidad().getId())
                .especialidadNombre(sub.getEspecialidad().getNombre())
                .tipoPermiso(p.getTipoPermiso())
                .activo(p.getActivo())
                .creadoEn(p.getCreadoEn())
                .build();
    }
}
