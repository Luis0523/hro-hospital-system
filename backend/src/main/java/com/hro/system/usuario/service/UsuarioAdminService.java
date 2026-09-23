package com.hro.system.usuario.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.usuario.dto.UsuarioResponseDTO;
import com.hro.system.usuario.entity.RolSistema;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Administración de usuarios internos. El alta de usuarios proviene del proveedor
 * externo de identidad (aprovisionamiento JIT en {@link UsuarioReferenciaService}),
 * por lo que aquí solo se consultan, se activan/desactivan y se les asigna rol.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioAdminService {

    private final UsuarioReferenciaRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listar(Boolean activo, String rol) {
        String rolNormalizado = (rol != null && !rol.isBlank()) ? RolSistema.from(rol).getValor() : null;

        List<UsuarioReferencia> usuarios;
        if (activo == null) {
            usuarios = (rolNormalizado == null)
                    ? usuarioRepository.findAll()
                    : usuarioRepository.findByRolPrincipal(rolNormalizado);
        } else {
            usuarios = (rolNormalizado == null)
                    ? usuarioRepository.findByActivo(activo)
                    : usuarioRepository.findByActivoAndRolPrincipal(activo, rolNormalizado);
        }
        return usuarios.stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorId(Long id) {
        return mapToDTO(obtener(id));
    }

    @Transactional
    public UsuarioResponseDTO activar(Long id) {
        return cambiarEstado(id, true);
    }

    @Transactional
    public UsuarioResponseDTO desactivar(Long id) {
        return cambiarEstado(id, false);
    }

    @Transactional
    public UsuarioResponseDTO cambiarEstado(Long id, boolean activo) {
        UsuarioReferencia usuario = obtener(id);
        if (Boolean.valueOf(activo).equals(usuario.getActivo())) {
            return mapToDTO(usuario);
        }

        usuario.setActivo(activo);
        UsuarioReferencia guardado = usuarioRepository.save(usuario);
        publicarAuditoria(guardado, activo ? "activar" : "desactivar");

        log.info("Usuario {} {}", guardado.getIdExterno(), activo ? "activado" : "desactivado");
        return mapToDTO(guardado);
    }

    @Transactional
    public UsuarioResponseDTO asignarRol(Long id, String rolPrincipal) {
        RolSistema rol = RolSistema.from(rolPrincipal);
        UsuarioReferencia usuario = obtener(id);

        usuario.setRolPrincipal(rol.getValor());
        UsuarioReferencia guardado = usuarioRepository.save(usuario);
        publicarAuditoria(guardado, "asignar_rol");

        log.info("Rol '{}' asignado al usuario {}", rol.getValor(), guardado.getIdExterno());
        return mapToDTO(guardado);
    }

    private UsuarioReferencia obtener(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", id));
    }

    private void publicarAuditoria(UsuarioReferencia usuario, String accion) {
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("usuario_referencia")
                .entidadId(usuario.getId())
                .accion(accion)
                .valoresNuevos(usuario)
                .build());
    }

    private UsuarioResponseDTO mapToDTO(UsuarioReferencia u) {
        return UsuarioResponseDTO.builder()
                .id(u.getId())
                .idExterno(u.getIdExterno())
                .nombreMostrar(u.getNombreMostrar())
                .rolPrincipal(u.getRolPrincipal())
                .activo(u.getActivo())
                .ultimoAcceso(u.getUltimoAcceso())
                .creadoEn(u.getCreadoEn())
                .build();
    }
}
