package com.hro.system.agenda.service;

import com.hro.system.agenda.dto.CupoDiarioResponseDTO;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.CupoAgotadoException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.medico.entity.MedicoClinica;
import com.hro.system.medico.repository.MedicoClinicaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CupoDiarioService {

    private final CupoDiarioRepository cupoDiarioRepository;
    private final MedicoClinicaRepository medicoClinicaRepository;
    private final DiaNoLaborableRepository diaNoLaborableRepository;

    /**
     * Obtiene el registro de cupo diario o lo inicializa atómicamente si aún no existe para la fecha indicada.
     * Valida que la fecha coincida con el día de la semana de atención del médico y que no sea día no laborable.
     */
    @Transactional
    public CupoDiario obtenerOCrearCupoDiario(Long medicoClinicaId, LocalDate fecha) {
        MedicoClinica medicoClinica = medicoClinicaRepository.findById(medicoClinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Asignación médico-clínica no encontrada con ID: " + medicoClinicaId));

        if (!Boolean.TRUE.equals(medicoClinica.getActivo())) {
            throw new BusinessException("El horario del médico en esta clínica se encuentra inactivo.");
        }

        short diaSemanaFecha = (short) fecha.getDayOfWeek().getValue();
        if (diaSemanaFecha != medicoClinica.getDiaSemana()) {
            throw new BusinessException(String.format(
                    "El médico no atiende el día seleccionado (%s). Atiende únicamente los días con código %d.",
                    fecha.getDayOfWeek(), medicoClinica.getDiaSemana()
            ));
        }

        if (diaNoLaborableRepository.existsByFecha(fecha)) {
            throw new BusinessException("La fecha " + fecha + " está registrada como día no laborable institucional.");
        }

        // Inicializar de forma atómica y segura contra concurrencia
        cupoDiarioRepository.inicializarCupoSiNoExiste(medicoClinicaId, fecha, medicoClinica.getCapacidadMaxima());

        return cupoDiarioRepository.findByMedicoClinicaIdAndFecha(medicoClinicaId, fecha)
                .orElseThrow(() -> new ResourceNotFoundException("Error al inicializar el cupo diario para la fecha: " + fecha));
    }

    /**
     * Realiza la reserva atómica de un cupo diario para un médico-clínica y fecha.
     * Si no hay cupos libres, lanza CupoAgotadoException (HTTP 409 CONFLICT).
     */
    @Transactional
    public CupoDiario reservarCupoAtomico(Long medicoClinicaId, LocalDate fecha) {
        CupoDiario cupo = obtenerOCrearCupoDiario(medicoClinicaId, fecha);

        boolean reservado = cupoDiarioRepository.incrementarCupoAtomico(cupo.getId());
        if (!reservado) {
            log.warn("Intento de sobreventa bloqueado: Cupo diario {} agotado para la fecha {}", cupo.getId(), fecha);
            throw new CupoAgotadoException(String.format(
                    "No hay cupos disponibles para la fecha %s. Se ha alcanzado la capacidad máxima de %d pacientes.",
                    fecha, cupo.getCapacidadMaxima()
            ));
        }

        return cupoDiarioRepository.findById(cupo.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cupo diario no encontrado"));
    }

    /**
     * Libera de forma atómica un cupo previamente ocupado (en caso de cancelación o reprogramación de cita).
     */
    @Transactional
    public void liberarCupoAtomico(Long cupoDiarioId) {
        boolean decrementado = cupoDiarioRepository.decrementarCupoAtomico(cupoDiarioId);
        if (!decrementado) {
            log.warn("Se intentó decrementar un cupo diario ({}) que ya tenía 0 cupos ocupados o no existía.", cupoDiarioId);
        } else {
            log.info("Cupo liberado exitosamente para cupo_diario ID: {}", cupoDiarioId);
        }
    }

    /**
     * Consulta disponibilidad y estado de cupos en un rango de fechas.
     */
    @Transactional
    public List<CupoDiarioResponseDTO> consultarDisponibilidad(Long clinicaId, Long medicoId, Long medicoClinicaId, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDate inicio = (fechaInicio != null) ? fechaInicio : LocalDate.now();
        LocalDate fin = (fechaFin != null) ? fechaFin : inicio.plusDays(14);

        if (fin.isBefore(inicio)) {
            throw new BusinessException("La fecha final no puede ser anterior a la fecha inicial.");
        }

        // Si se consulta un medicoClinica puntual, aseguramos generar los días válidos en el rango
        List<MedicoClinica> asignaciones = new ArrayList<>();
        if (medicoClinicaId != null) {
            medicoClinicaRepository.findById(medicoClinicaId).ifPresent(asignaciones::add);
        } else if (clinicaId != null && medicoId != null) {
            asignaciones.addAll(medicoClinicaRepository.findByMedicoIdAndClinicaId(medicoId, clinicaId));
        } else if (clinicaId != null) {
            asignaciones.addAll(medicoClinicaRepository.findByClinicaId(clinicaId));
        } else if (medicoId != null) {
            asignaciones.addAll(medicoClinicaRepository.findByMedicoId(medicoId));
        } else {
            asignaciones.addAll(medicoClinicaRepository.findAll());
        }

        List<CupoDiarioResponseDTO> resultado = new ArrayList<>();

        for (MedicoClinica mc : asignaciones) {
            if (!Boolean.TRUE.equals(mc.getActivo())) {
                continue;
            }
            // Recorrer cada día en el rango y ver si coincide con el dia_semana
            LocalDate cursor = inicio;
            while (!cursor.isAfter(fin)) {
                if (cursor.getDayOfWeek().getValue() == mc.getDiaSemana() && !diaNoLaborableRepository.existsByFecha(cursor)) {
                    CupoDiario cupo = obtenerOCrearCupoDiario(mc.getId(), cursor);
                    resultado.add(CupoDiarioResponseDTO.fromEntity(cupo));
                }
                cursor = cursor.plusDays(1);
            }
        }

        return resultado;
    }
}
