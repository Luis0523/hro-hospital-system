package com.hro.system.paciente.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.paciente.dto.ActualizarPacienteRequestDTO;
import com.hro.system.paciente.dto.CrearPacienteRequestDTO;
import com.hro.system.paciente.dto.PacienteResponseDTO;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        if (dto.getNumeroExpediente() != null && !dto.getNumeroExpediente().trim().isEmpty()) {
            if (pacienteRepository.findByNumeroExpediente(dto.getNumeroExpediente().trim()).isPresent()) {
                throw new BusinessException("Ya existe un paciente con el número de expediente: " + dto.getNumeroExpediente());
            }
        }

        Paciente paciente = Paciente.builder()
                .dpi(dto.getDpi().trim())
                .nombres(dto.getNombres().trim())
                .apellidos(dto.getApellidos().trim())
                .fechaNacimiento(dto.getFechaNacimiento())
                .sexo(dto.getSexo().trim())
                .telefono(dto.getTelefono() != null ? dto.getTelefono().trim() : null)
                .direccion(dto.getDireccion() != null ? dto.getDireccion().trim() : null)
                .numeroExpediente(dto.getNumeroExpediente() != null && !dto.getNumeroExpediente().trim().isEmpty()
                        ? dto.getNumeroExpediente().trim() : null)
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

    @Transactional
    public PacienteResponseDTO actualizarPaciente(Long id, ActualizarPacienteRequestDTO dto) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "id", id));

        String nuevoExpediente = dto.getNumeroExpediente() != null && !dto.getNumeroExpediente().trim().isEmpty()
                ? dto.getNumeroExpediente().trim() : null;

        if (nuevoExpediente != null && pacienteRepository.existsByNumeroExpedienteAndIdNot(nuevoExpediente, id)) {
            throw new BusinessException("Ya existe otro paciente con el número de expediente: " + nuevoExpediente);
        }

        // Clon para auditoría
        Paciente estadoAnterior = Paciente.builder()
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

        paciente.setNombres(dto.getNombres().trim());
        paciente.setApellidos(dto.getApellidos().trim());
        paciente.setFechaNacimiento(dto.getFechaNacimiento());
        paciente.setSexo(dto.getSexo().trim());
        paciente.setTelefono(dto.getTelefono() != null ? dto.getTelefono().trim() : null);
        paciente.setDireccion(dto.getDireccion() != null ? dto.getDireccion().trim() : null);
        paciente.setNumeroExpediente(nuevoExpediente);

        Paciente actualizado = pacienteRepository.save(paciente);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("paciente")
                .entidadId(actualizado.getId())
                .accion("actualizar")
                .usuarioReferenciaId(null)
                .valoresAnteriores(estadoAnterior)
                .valoresNuevos(actualizado)
                .build());

        log.info("Paciente actualizado con ID: {}", actualizado.getId());
        return mapToDTO(actualizado);
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO buscarPorDpi(String dpi) {
        Paciente paciente = pacienteRepository.findByDpi(dpi.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "DPI", dpi));
        return mapToDTO(paciente);
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO buscarPorExpediente(String numeroExpediente) {
        Paciente paciente = pacienteRepository.findByNumeroExpediente(numeroExpediente.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "número de expediente", numeroExpediente));
        return mapToDTO(paciente);
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO buscarPorId(Long id) {
        Paciente paciente = pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "id", id));
        return mapToDTO(paciente);
    }

    @Transactional(readOnly = true)
    public Page<PacienteResponseDTO> buscarMulticriterio(String filtro, Pageable pageable) {
        String termino = filtro != null ? filtro.trim() : "";
        return pacienteRepository.buscarMulticriterio(termino, pageable)
                .map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public Page<PacienteResponseDTO> listarPaginado(Pageable pageable) {
        return pacienteRepository.findAll(pageable)
                .map(this::mapToDTO);
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
