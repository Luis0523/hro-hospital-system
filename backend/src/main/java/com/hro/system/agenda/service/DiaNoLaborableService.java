package com.hro.system.agenda.service;

import com.hro.system.agenda.dto.CrearDiaNoLaborableRequestDTO;
import com.hro.system.agenda.dto.DiaNoLaborableResponseDTO;
import com.hro.system.agenda.entity.DiaNoLaborable;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiaNoLaborableService {

    private final DiaNoLaborableRepository diaNoLaborableRepository;
    private final CitaRepository citaRepository;
    private final UsuarioReferenciaRepository usuarioReferenciaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public DiaNoLaborableResponseDTO registrarDiaNoLaborable(CrearDiaNoLaborableRequestDTO dto) {
        if (diaNoLaborableRepository.existsByFecha(dto.getFecha())) {
            throw new BusinessException("La fecha " + dto.getFecha() + " ya está registrada como día no laborable.");
        }

        // HU-15: Validación crítica de citas existentes
        long citasAfectadas = citaRepository.contarCitasActivasEnFecha(dto.getFecha());
        if (citasAfectadas > 0) {
            throw new BusinessException("No se puede registrar como día no laborable: Existen " + citasAfectadas +
                    " cita(s) programada(s) para el " + dto.getFecha() + ". Deben ser reprogramadas o canceladas antes de bloquear el día.");
        }

        UsuarioReferencia creadoPor = null;
        if (dto.getCreadoPorId() != null) {
            creadoPor = usuarioReferenciaRepository.findById(dto.getCreadoPorId()).orElse(null);
        }
        if (creadoPor == null) {
            // Usuario por defecto si no se especifica
            creadoPor = usuarioReferenciaRepository.findAll().stream().findFirst()
                    .orElseGet(() -> usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                            .idExterno("system-admin")
                            .nombreMostrar("Administrador HRO")
                            .rolPrincipal("administrador")
                            .activo(true)
                            .build()));
        }

        DiaNoLaborable dia = DiaNoLaborable.builder()
                .fecha(dto.getFecha())
                .motivo(dto.getMotivo().trim())
                .creadoPor(creadoPor)
                .creadoEn(OffsetDateTime.now())
                .build();

        DiaNoLaborable guardado = diaNoLaborableRepository.save(dia);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("dia_no_laborable")
                .entidadId(guardado.getId())
                .accion("crear")
                .usuarioReferenciaId(creadoPor.getId())
                .valoresNuevos(guardado)
                .build());

        log.info("Día no laborable registrado: {} ({}) por {}", guardado.getFecha(), guardado.getMotivo(), creadoPor.getNombreMostrar());
        return mapToDTO(guardado);
    }

    @Transactional
    public void eliminarDiaNoLaborable(Long id) {
        DiaNoLaborable dia = diaNoLaborableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DiaNoLaborable", "id", id));
        diaNoLaborableRepository.delete(dia);
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborableResponseDTO> listarTodos() {
        return diaNoLaborableRepository.findAll().stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborableResponseDTO> listarFuturos() {
        return diaNoLaborableRepository.findFuturos(LocalDate.now()).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborableResponseDTO> listarPorRango(LocalDate inicio, LocalDate fin) {
        return diaNoLaborableRepository.findByRangoFechas(inicio, fin).stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean esDiaNoLaborable(LocalDate fecha) {
        return diaNoLaborableRepository.existsByFecha(fecha);
    }

    private DiaNoLaborableResponseDTO mapToDTO(DiaNoLaborable d) {
        return DiaNoLaborableResponseDTO.builder()
                .id(d.getId())
                .fecha(d.getFecha())
                .motivo(d.getMotivo())
                .creadoPorId(d.getCreadoPor().getId())
                .creadoPorNombre(d.getCreadoPor().getNombreMostrar())
                .creadoEn(d.getCreadoEn())
                .build();
    }
}
