package com.hro.system.medico.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.medico.dto.ActualizarMedicoRequestDTO;
import com.hro.system.medico.dto.CrearMedicoRequestDTO;
import com.hro.system.medico.dto.MedicoResponseDTO;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicoService {

    private final MedicoRepository medicoRepository;
    private final UsuarioReferenciaRepository usuarioReferenciaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public MedicoResponseDTO crearMedico(CrearMedicoRequestDTO dto) {
        if (medicoRepository.findByNumeroColegiado(dto.getNumeroColegiado().trim()).isPresent()) {
            throw new BusinessException("Ya existe un médico registrado con el número de colegiado: " + dto.getNumeroColegiado());
        }

        UsuarioReferencia usuario = resolverUsuario(dto.getUsuarioReferenciaId());

        Medico medico = Medico.builder()
                .nombres(dto.getNombres().trim())
                .numeroColegiado(dto.getNumeroColegiado().trim())
                .usuarioReferencia(usuario)
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        Medico guardado = medicoRepository.save(medico);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("medico")
                .entidadId(guardado.getId())
                .accion("crear")
                .valoresNuevos(guardado)
                .build());

        log.info("Médico registrado: Dr(a). {} (Colegiado: {})", guardado.getNombres(), guardado.getNumeroColegiado());
        return mapToDTO(guardado);
    }

    @Transactional
    public MedicoResponseDTO actualizarMedico(UUID id, ActualizarMedicoRequestDTO dto) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "id", id));

        if (medicoRepository.existsByNumeroColegiadoAndIdNot(dto.getNumeroColegiado().trim(), id)) {
            throw new BusinessException("Ya existe otro médico registrado con el colegiado: " + dto.getNumeroColegiado());
        }

        UsuarioReferencia usuario = resolverUsuario(dto.getUsuarioReferenciaId());

        medico.setNombres(dto.getNombres().trim());
        medico.setNumeroColegiado(dto.getNumeroColegiado().trim());
        medico.setUsuarioReferencia(usuario);
        medico.setActivo(dto.getActivo());

        Medico actualizado = medicoRepository.save(medico);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("medico")
                .entidadId(actualizado.getId())
                .accion("actualizar")
                .valoresNuevos(actualizado)
                .build());

        return mapToDTO(actualizado);
    }

    @Transactional
    public MedicoResponseDTO cambiarEstado(UUID id, boolean activo) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "id", id));

        if (Boolean.valueOf(activo).equals(medico.getActivo())) {
            return mapToDTO(medico);
        }

        medico.setActivo(activo);
        Medico guardado = medicoRepository.save(medico);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("medico")
                .entidadId(guardado.getId())
                .accion(activo ? "reactivar" : "desactivar")
                .valoresNuevos(guardado)
                .build());

        log.info("Médico {} {}", guardado.getNombres(), activo ? "reactivado" : "desactivado");
        return mapToDTO(guardado);
    }

    @Transactional
    public MedicoResponseDTO reactivar(UUID id) {
        return cambiarEstado(id, true);
    }

    @Transactional(readOnly = true)
    public List<MedicoResponseDTO> listarActivos() {
        return medicoRepository.findByActivoTrue().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicoResponseDTO> listarPorEstado(Boolean activo) {
        if (activo == null) {
            return medicoRepository.findAll().stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        return medicoRepository.findByActivo(activo).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicoResponseDTO buscarPorId(UUID id) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "id", id));
        return mapToDTO(medico);
    }

    @Transactional(readOnly = true)
    public MedicoResponseDTO buscarPorColegiado(String numeroColegiado) {
        Medico medico = medicoRepository.findByNumeroColegiado(numeroColegiado.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "número de colegiado", numeroColegiado));
        return mapToDTO(medico);
    }

    private UsuarioReferencia resolverUsuario(Long usuarioReferenciaId) {
        if (usuarioReferenciaId == null) {
            return null;
        }
        UsuarioReferencia usuario = usuarioReferenciaRepository.findById(usuarioReferenciaId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioReferenciaId));
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new BusinessException("El usuario de referencia " + usuario.getNombreMostrar() + " está inactivo.");
        }
        return usuario;
    }

    private MedicoResponseDTO mapToDTO(Medico m) {
        return MedicoResponseDTO.builder()
                .id(m.getId())
                .nombres(m.getNombres())
                .numeroColegiado(m.getNumeroColegiado())
                .usuarioReferenciaId(m.getUsuarioReferencia() != null ? m.getUsuarioReferencia().getId() : null)
                .activo(m.getActivo())
                .creadoEn(m.getCreadoEn())
                .build();
    }
}
