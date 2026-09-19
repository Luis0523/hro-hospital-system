package com.hro.system.auditoria.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.auditoria.entity.AuditoriaGeneral;
import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.auditoria.repository.AuditoriaGeneralRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

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
    public Page<AuditoriaGeneral> listarAuditoria(String tabla, Long usuarioId, Pageable pageable) {
        if (tabla != null && !tabla.isBlank()) {
            return auditoriaRepository.findByTablaAfectadaIgnoreCase(tabla, pageable);
        }
        if (usuarioId != null) {
            return auditoriaRepository.findByUsuarioReferenciaId(usuarioId, pageable);
        }
        return auditoriaRepository.findAll(pageable);
    }
}
