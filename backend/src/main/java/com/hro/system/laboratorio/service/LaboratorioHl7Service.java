package com.hro.system.laboratorio.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.laboratorio.entity.MensajeHl7Log;
import com.hro.system.laboratorio.entity.OrdenLaboratorio;
import com.hro.system.laboratorio.repository.MensajeHl7LogRepository;
import com.hro.system.laboratorio.repository.OrdenLaboratorioRepository;
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
public class LaboratorioHl7Service {

    private final MensajeHl7LogRepository hl7LogRepository;
    private final OrdenLaboratorioRepository ordenRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public MensajeHl7Log registrarMensajeHl7(UUID ordenId, String direccion, String contenidoCrudo, String estado) {
        OrdenLaboratorio orden = null;
        if (ordenId != null) {
            orden = ordenRepository.findById(ordenId).orElse(null);
        }

        MensajeHl7Log logMsg = MensajeHl7Log.builder()
                .ordenLaboratorio(orden)
                .direccion(direccion)
                .contenidoCrudo(contenidoCrudo)
                .estadoProcesamiento(estado != null ? estado : "ok")
                .fecha(OffsetDateTime.now())
                .build();

        MensajeHl7Log guardado = hl7LogRepository.save(logMsg);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("mensaje_hl7_log")
                .entidadId(guardado.getId())
                .accion("crear")
                .usuarioReferenciaId(null)
                .valoresAnteriores(null)
                .valoresNuevos(guardado)
                .build());

        log.info("Mensaje HL7 {} registrado con ID: {}", direccion, guardado.getId());
        return guardado;
    }

    @Transactional(readOnly = true)
    public boolean tieneOrdenesPendientes(Long citaId) {
        List<OrdenLaboratorio> pendientes = ordenRepository.findByCitaIdAndEstado(citaId, "pendiente");
        return !pendientes.isEmpty();
    }
}
