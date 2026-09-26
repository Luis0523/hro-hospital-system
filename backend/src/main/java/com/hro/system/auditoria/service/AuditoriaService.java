package com.hro.system.auditoria.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.auditoria.dto.AuditoriaResponseDTO;
import com.hro.system.auditoria.entity.AuditoriaGeneral;
import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.auditoria.repository.AuditoriaGeneralRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaGeneralRepository auditoriaRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarBitacora(AuditoriaEvent event) {
        try {
            UsuarioReferencia usuario = null;
            if (event.getUsuarioReferenciaId() != null) {
                usuario = usuarioRepository.findById(event.getUsuarioReferenciaId()).orElse(null);
            }

            String valoresAnterioresJson = event.getValoresAnteriores() != null
                    ? objectMapper.writeValueAsString(event.getValoresAnteriores())
                    : null;

            String valoresNuevosJson = event.getValoresNuevos() != null
                    ? objectMapper.writeValueAsString(event.getValoresNuevos())
                    : null;

            AuditoriaGeneral registro = AuditoriaGeneral.builder()
                    .tablaAfectada(event.getTablaAfectada())
                    .entidadId(String.valueOf(event.getEntidadId()))
                    .accion(event.getAccion())
                    .usuarioReferencia(usuario)
                    .valoresAnteriores(valoresAnterioresJson)
                    .valoresNuevos(valoresNuevosJson)
                    .fecha(OffsetDateTime.now())
                    .build();

            auditoriaRepository.save(registro);
            log.debug("Auditoría registrada exitosamente para tabla: {}, ID: {}", event.getTablaAfectada(), event.getEntidadId());

        } catch (Exception ex) {
            log.error("Error al serializar o persistir bitácora de auditoría para la tabla {}", event.getTablaAfectada(), ex);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditoriaResponseDTO> listarAuditoria(String tabla, Long usuarioId, String accion,
                                                      LocalDate fechaInicio, LocalDate fechaFin, Pageable pageable) {
        Specification<AuditoriaGeneral> filtro = construirFiltro(tabla, usuarioId, accion, fechaInicio, fechaFin);
        return auditoriaRepository.findAll(filtro, pageable).map(this::mapToDTO);
    }

    private Specification<AuditoriaGeneral> construirFiltro(String tabla, Long usuarioId, String accion,
                                                            LocalDate fechaInicio, LocalDate fechaFin) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (tabla != null && !tabla.isBlank()) {
                predicados.add(cb.equal(cb.lower(root.get("tablaAfectada")), tabla.trim().toLowerCase()));
            }
            if (usuarioId != null) {
                predicados.add(cb.equal(root.get("usuarioReferencia").get("id"), usuarioId));
            }
            if (accion != null && !accion.isBlank()) {
                predicados.add(cb.equal(cb.lower(root.get("accion")), accion.trim().toLowerCase()));
            }
            if (fechaInicio != null) {
                predicados.add(cb.greaterThanOrEqualTo(root.get("fecha"),
                        fechaInicio.atStartOfDay().atOffset(ZoneOffset.UTC)));
            }
            if (fechaFin != null) {
                predicados.add(cb.lessThan(root.get("fecha"),
                        fechaFin.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }

    private AuditoriaResponseDTO mapToDTO(AuditoriaGeneral a) {
        UsuarioReferencia usuario = a.getUsuarioReferencia();
        return AuditoriaResponseDTO.builder()
                .id(a.getId())
                .tablaAfectada(a.getTablaAfectada())
                .entidadId(a.getEntidadId())
                .accion(a.getAccion())
                .usuarioId(usuario != null ? usuario.getId() : null)
                .usuarioNombre(usuario != null ? usuario.getNombreMostrar() : null)
                .valoresAnteriores(a.getValoresAnteriores())
                .valoresNuevos(a.getValoresNuevos())
                .fecha(a.getFecha())
                .build();
    }
}
