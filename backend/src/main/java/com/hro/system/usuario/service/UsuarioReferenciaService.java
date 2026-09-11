package com.hro.system.usuario.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.PermisoClinicaRepository;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioReferenciaService {

    private final UsuarioReferenciaRepository usuarioRepository;
    private final PermisoClinicaRepository permisoClinicaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public UsuarioReferencia sincronizarUsuarioJIT(String idExterno, String nombreMostrar, String rolPrincipal) {
        Optional<UsuarioReferencia> existente = usuarioRepository.findByIdExterno(idExterno);

        if (existente.isPresent()) {
            UsuarioReferencia usuario = existente.get();
            usuario.setNombreMostrar(nombreMostrar);
            usuario.setRolPrincipal(rolPrincipal);
            usuario.setUltimoAcceso(OffsetDateTime.now());
            return usuarioRepository.save(usuario);
        }

        UsuarioReferencia nuevo = UsuarioReferencia.builder()
                .idExterno(idExterno)
                .nombreMostrar(nombreMostrar)
                .rolPrincipal(rolPrincipal)
                .activo(true)
                .ultimoAcceso(OffsetDateTime.now())
                .creadoEn(OffsetDateTime.now())
                .build();

        UsuarioReferencia guardado = usuarioRepository.save(nuevo);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("usuario_referencia")
                .entidadId(guardado.getId())
                .accion("crear")
                .usuarioReferenciaId(guardado.getId())
                .valoresAnteriores(null)
                .valoresNuevos(guardado)
                .build());

        log.info("Usuario JIT aprovisionado exitosamente con ID: {}, ID Externo: {}", guardado.getId(), idExterno);
        return guardado;
    }

    @Transactional(readOnly = true)
    public boolean tienePermisoEnClinica(Long usuarioId, Long clinicaId, String tipoPermiso) {
        return permisoClinicaRepository
                .findByUsuarioReferenciaIdAndClinicaIdAndTipoPermiso(usuarioId, clinicaId, tipoPermiso)
                .isPresent();
    }
}
