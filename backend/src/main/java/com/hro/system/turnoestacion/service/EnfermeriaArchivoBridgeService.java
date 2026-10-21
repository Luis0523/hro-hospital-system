package com.hro.system.turnoestacion.service;

import com.hro.system.archivo.dto.TransicionCicloRequestDTO;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.service.ArchivoService;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnfermeriaArchivoBridgeService {

    private final ArchivoService archivoService;
    private final CitaRepository citaRepository;

    @Transactional
    public VinculoExpediente vincular(Expediente expediente, Long citaId, String observacion) {
        if (Boolean.TRUE.equals(expediente.getDepurado()) || !Boolean.TRUE.equals(expediente.getActivo())) {
            throw new BusinessException("El expediente no está disponible para vinculación");
        }
        if (citaId != null) {
            Cita cita = citaRepository.findById(citaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", citaId));
            if (!cita.getPaciente().getId().equals(expediente.getPaciente().getId())) {
                throw new BusinessException("La cita indicada no pertenece al paciente del expediente");
            }
        }
        ExpedienteCiclo ciclo = archivoService.vincularCicloDesdeEnfermeria(
                expediente.getId(), citaId, observacion);
        return new VinculoExpediente(expediente, ciclo);
    }

    public void reflejarDevolucion(ExpedienteCiclo ciclo, String observacion) {
        if (ciclo == null || !ArchivoService.ENTREGADO.equals(ciclo.getEstadoActual())) {
            return;
        }
        try {
            archivoService.retornar(ciclo.getId(), new TransicionCicloRequestDTO(null, observacion));
        } catch (RuntimeException ex) {
            log.warn("No se pudo reflejar la devolución en Archivo para el ciclo {}: {}",
                    ciclo.getId(), ex.getMessage());
        }
    }

    public void reflejarArchivado(ExpedienteCiclo ciclo, Long ubicacionDestinoId, String observacion) {
        if (ciclo == null || !ArchivoService.EN_TRANSITO_RETORNO.equals(ciclo.getEstadoActual())) {
            return;
        }
        try {
            archivoService.archivar(ciclo.getId(),
                    new TransicionCicloRequestDTO(ubicacionDestinoId, observacion));
        } catch (RuntimeException ex) {
            log.warn("No se pudo reflejar el archivado en Archivo para el ciclo {}: {}",
                    ciclo.getId(), ex.getMessage());
        }
    }

    public record VinculoExpediente(Expediente expediente, ExpedienteCiclo ciclo) {
    }
}
