package com.hro.system.agenda.service;

import com.hro.system.agenda.dto.CupoDiarioResponseDTO;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.CupoAgotadoException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.medico.entity.MedicoSubespecialidad;
import com.hro.system.medico.repository.MedicoSubespecialidadRepository;
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
    private final MedicoSubespecialidadRepository medicoSubespecialidadRepository;
    private final DiaNoLaborableRepository diaNoLaborableRepository;

    /**
     * Obtiene el cupo diario o lo inicializa atómicamente. Valida día de la semana del médico
     * y que la fecha no sea día no laborable.
     */
    @Transactional
    public CupoDiario obtenerOCrearCupoDiario(Long medicoSubespecialidadId, LocalDate fecha) {
        MedicoSubespecialidad ms = medicoSubespecialidadRepository.findById(medicoSubespecialidadId)
                .orElseThrow(() -> new ResourceNotFoundException("Programación médico-subespecialidad no encontrada con ID: " + medicoSubespecialidadId));

        if (!Boolean.TRUE.equals(ms.getActivo())) {
            throw new BusinessException("El horario del médico en esta subespecialidad se encuentra inactivo.");
        }

        short diaSemanaFecha = (short) fecha.getDayOfWeek().getValue();
        if (diaSemanaFecha != ms.getDiaSemana()) {
            throw new BusinessException(String.format(
                    "El médico no atiende el día seleccionado (%s). Atiende únicamente los días con código %d.",
                    fecha.getDayOfWeek(), ms.getDiaSemana()
            ));
        }

        if (diaNoLaborableRepository.existsByFecha(fecha)) {
            throw new BusinessException("La fecha " + fecha + " está registrada como día no laborable institucional.");
        }

        cupoDiarioRepository.inicializarCupoSiNoExiste(medicoSubespecialidadId, fecha, ms.getCapacidadMaxima());

        return cupoDiarioRepository.findByMedicoSubespecialidadIdAndFecha(medicoSubespecialidadId, fecha)
                .orElseThrow(() -> new ResourceNotFoundException("Error al inicializar el cupo diario para la fecha: " + fecha));
    }

    @Transactional
    public CupoDiario reservarCupoAtomico(Long medicoSubespecialidadId, LocalDate fecha) {
        CupoDiario cupo = obtenerOCrearCupoDiario(medicoSubespecialidadId, fecha);

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
     * Consulta disponibilidad en un rango. El filtro principal ahora es por subespecialidad
     * (no por sala física), porque la sala se resuelve por día.
     */
    @Transactional
    public List<CupoDiarioResponseDTO> consultarDisponibilidad(Long subespecialidadId, Long medicoId, Long medicoSubespecialidadId, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDate inicio = (fechaInicio != null) ? fechaInicio : LocalDate.now();
        LocalDate fin = (fechaFin != null) ? fechaFin : inicio.plusDays(14);

        if (fin.isBefore(inicio)) {
            throw new BusinessException("La fecha final no puede ser anterior a la fecha inicial.");
        }

        List<MedicoSubespecialidad> asignaciones = new ArrayList<>();
        if (medicoSubespecialidadId != null) {
            medicoSubespecialidadRepository.findById(medicoSubespecialidadId).ifPresent(asignaciones::add);
        } else if (subespecialidadId != null && medicoId != null) {
            asignaciones.addAll(medicoSubespecialidadRepository.findByMedicoIdAndSubespecialidadId(medicoId, subespecialidadId));
        } else if (subespecialidadId != null) {
            asignaciones.addAll(medicoSubespecialidadRepository.findBySubespecialidadId(subespecialidadId));
        } else if (medicoId != null) {
            asignaciones.addAll(medicoSubespecialidadRepository.findByMedicoId(medicoId));
        } else {
            asignaciones.addAll(medicoSubespecialidadRepository.findAll());
        }

        List<CupoDiarioResponseDTO> resultado = new ArrayList<>();

        for (MedicoSubespecialidad ms : asignaciones) {
            if (!Boolean.TRUE.equals(ms.getActivo())) {
                continue;
            }
            LocalDate cursor = inicio;
            while (!cursor.isAfter(fin)) {
                if (cursor.getDayOfWeek().getValue() == ms.getDiaSemana() && !diaNoLaborableRepository.existsByFecha(cursor)) {
                    CupoDiario cupo = obtenerOCrearCupoDiario(ms.getId(), cursor);
                    resultado.add(CupoDiarioResponseDTO.fromEntity(cupo));
                }
                cursor = cursor.plusDays(1);
            }
        }

        return resultado;
    }
}
