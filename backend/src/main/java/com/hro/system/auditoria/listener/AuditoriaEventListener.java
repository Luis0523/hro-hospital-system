package com.hro.system.auditoria.listener;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.auditoria.service.AuditoriaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditoriaEventListener {

    private final AuditoriaService auditoriaService;

    @Async
    @EventListener
    public void manejarEventoAuditoria(AuditoriaEvent event) {
        log.debug("Procesando evento de auditoría asíncrono para entidad: {}", event.getTablaAfectada());
        auditoriaService.registrarBitacora(event);
    }
}
