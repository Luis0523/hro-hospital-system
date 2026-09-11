package com.hro.system.paciente.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.paciente.dto.CrearPacienteRequestDTO;
import com.hro.system.paciente.dto.PacienteResponseDTO;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
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
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public PacienteResponseDTO registrarPaciente(CrearPacienteRequestDTO dto) {
        if (pacienteRepository.findByDpi(dto.getDpi()).isPresent()) {
            throw new BusinessException("Ya existe un paciente registrado con el DPI: " + dto.getDpi());
        }

        Paciente paciente = Paciente.builder()
                .dpi(dto.getDpi())
                .nombres(dto.getNombres())
                .apellidos(dto.getApellidos())
                .fechaNacimiento(dto.getFechaNacimiento())
                .sexo(dto.getSexo())
                .telefono(dto.getTelefono())
                .direccion(dto.getDireccion())
                .numeroExpediente(dto.getNumeroExpediente())
                .creadoEn(OffsetDateTime.now())
                .build();

        Paciente guardado = pacienteRepository.save(paciente);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("paciente")
                .entidadId(guardado.getId())
                .accion("crear")
                .usuarioReferenciaId(null)
                .valoresAnteriores(null)
                .valoresNuevos(guardado)
                .build());

        log.info("Paciente registrado con ID: {}, DPI: {}", guardado.getId(), guardado.getDpi());
        return mapToDTO(guardado);
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO buscarPorDpi(String dpi) {
        Paciente paciente = pacienteRepository.findByDpi(dpi)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "DPI", dpi));
        return mapToDTO(paciente);
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO buscarPorId(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "id", id));
        return mapToDTO(paciente);
    }

    @Transactional(readOnly = true)
    public List<PacienteResponseDTO> listarTodos() {
        return pacienteRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    private PacienteResponseDTO mapToDTO(Paciente paciente) {
        return PacienteResponseDTO.builder()
                .id(paciente.getId())
                .dpi(paciente.getDpi())
                .nombres(paciente.getNombres())
                .apellidos(paciente.getApellidos())
                .fechaNacimiento(paciente.getFechaNacimiento())
                .sexo(paciente.getSexo())
                .telefono(paciente.getTelefono())
                .direccion(paciente.getDireccion())
                .numeroExpediente(paciente.getNumeroExpediente())
                .creadoEn(paciente.getCreadoEn())
                .build();
    }
}
