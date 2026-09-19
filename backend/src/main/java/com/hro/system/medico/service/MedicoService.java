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

        UsuarioReferencia usuario = null;
        if (dto.getUsuarioReferenciaId() != null) {
            usuario = usuarioReferenciaRepository.findById(dto.getUsuarioReferenciaId())
                    .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", dto.getUsuarioReferenciaId()));
        }

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

        UsuarioReferencia usuario = null;
        if (dto.getUsuarioReferenciaId() != null) {
            usuario = usuarioReferenciaRepository.findById(dto.getUsuarioReferenciaId())
                    .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", dto.getUsuarioReferenciaId()));
        }

        medico.setNombres(dto.getNombres().trim());
        medico.setNumeroColegiado(dto.getNumeroColegiado().trim());
        medico.setUsuarioReferencia(usuario);
        medico.setActivo(dto.getActivo());

        Medico actualizado = medicoRepository.save(medico);
        return mapToDTO(actualizado);
    }

    @Transactional
    public void cambiarEstado(UUID id, boolean activo) {
        Medico medico = medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medico", "id", id));
        medico.setActivo(activo);
        medicoRepository.save(medico);
    }

    @Transactional(readOnly = true)
    public List<MedicoResponseDTO> listarActivos() {
        return medicoRepository.findByActivoTrue().stream()
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
