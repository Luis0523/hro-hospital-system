package com.hro.system.agenda.service;

import com.hro.system.agenda.dto.CupoDiarioResponseDTO;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.CupoAgotadoException;
import com.hro.system.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CupoDiarioService {

    private final CupoDiarioRepository cupoDiarioRepository;
    private final SubespecialidadHorarioRepository subespecialidadHorarioRepository;
    private final DiaNoLaborableRepository diaNoLaborableRepository;

    /**
     * Obtiene el cupo diario o lo inicializa atómicamente a partir del horario de la
     * subespecialidad. Valida el día de la semana del horario y que no sea día no laborable.
     */
    @Transactional
    public CupoDiario obtenerOCrearCupoDiario(UUID subespecialidadHorarioId, LocalDate fecha) {
        SubespecialidadHorario horario = subespecialidadHorarioRepository.findById(subespecialidadHorarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Horario de subespecialidad no encontrado con ID: " + subespecialidadHorarioId));

        if (!Boolean.TRUE.equals(horario.getActivo())) {
            throw new BusinessException("El horario de esta subespecialidad se encuentra inactivo.");
        }

        short diaSemanaFecha = (short) fecha.getDayOfWeek().getValue();
        if (diaSemanaFecha != horario.getDiaSemana()) {
            throw new BusinessException(String.format(
                    "La subespecialidad no atiende el día seleccionado (%s). Atiende únicamente los días con código %d.",
                    fecha.getDayOfWeek(), horario.getDiaSemana()));
        }

        if (diaNoLaborableRepository.existsByFecha(fecha)) {
            throw new BusinessException("La fecha " + fecha + " está registrada como día no laborable institucional.");
        }

        // Solo inicializa si no existe: evita el INSERT ... ON CONFLICT innecesario
        // y mantiene la compatibilidad con H2 en pruebas.
        if (cupoDiarioRepository.findBySubespecialidadHorarioIdAndFecha(subespecialidadHorarioId, fecha).isEmpty()) {
            cupoDiarioRepository.inicializarCupoSiNoExiste(subespecialidadHorarioId, fecha, horario.getCapacidadMaxima());
        }

        return cupoDiarioRepository.findBySubespecialidadHorarioIdAndFecha(subespecialidadHorarioId, fecha)
                .orElseThrow(() -> new ResourceNotFoundException("Error al inicializar el cupo diario para la fecha: " + fecha));
    }

    @Transactional
    public CupoDiario reservarCupoAtomico(UUID subespecialidadHorarioId, LocalDate fecha) {
        CupoDiario cupo = obtenerOCrearCupoDiario(subespecialidadHorarioId, fecha);

        boolean reservado = cupoDiarioRepository.incrementarCupoAtomico(cupo.getId());
        if (!reservado) {
            log.warn("Intento de sobreventa bloqueado: Cupo diario {} agotado para la fecha {}", cupo.getId(), fecha);
            throw new CupoAgotadoException(String.format(
                    "No hay cupos disponibles para la fecha %s. Se ha alcanzado la capacidad máxima de %d pacientes.",
                    fecha, cupo.getCapacidadMaxima()));
        }

        return cupoDiarioRepository.findById(cupo.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cupo diario no encontrado"));
    }

    @Transactional
    public void liberarCupoAtomico(UUID cupoDiarioId) {
        boolean decrementado = cupoDiarioRepository.decrementarCupoAtomico(cupoDiarioId);
        if (!decrementado) {
            log.warn("Se intentó decrementar un cupo diario ({}) que ya tenía 0 cupos ocupados o no existía.", cupoDiarioId);
        } else {
            log.info("Cupo liberado exitosamente para cupo_diario ID: {}", cupoDiarioId);
        }
    }

    /**
     * Consulta disponibilidad en un rango a partir del horario de las subespecialidades.
     *
     * @param soloDisponibles si es {@code true}, omite los cupos sin disponibilidad.
     */
    @Transactional
    public List<CupoDiarioResponseDTO> consultarDisponibilidad(Long subespecialidadId, LocalDate fechaInicio,
                                                               LocalDate fechaFin, Boolean soloDisponibles) {
        LocalDate inicio = (fechaInicio != null) ? fechaInicio : LocalDate.now();
        LocalDate fin = (fechaFin != null) ? fechaFin : inicio.plusDays(14);

        if (fin.isBefore(inicio)) {
            throw new BusinessException("La fecha final no puede ser anterior a la fecha inicial.");
        }

        List<SubespecialidadHorario> horarios = new ArrayList<>();
        if (subespecialidadId != null) {
            horarios.addAll(subespecialidadHorarioRepository.findBySubespecialidadIdAndActivoTrue(subespecialidadId));
        } else {
            horarios.addAll(subespecialidadHorarioRepository.findByActivoTrue());
        }

        List<CupoDiarioResponseDTO> resultado = new ArrayList<>();
        for (SubespecialidadHorario horario : horarios) {
            LocalDate cursor = inicio;
            while (!cursor.isAfter(fin)) {
                if (cursor.getDayOfWeek().getValue() == horario.getDiaSemana()
                        && !diaNoLaborableRepository.existsByFecha(cursor)) {
                    CupoDiario cupo = obtenerOCrearCupoDiario(horario.getId(), cursor);
                    resultado.add(CupoDiarioResponseDTO.fromEntity(cupo));
                }
                cursor = cursor.plusDays(1);
            }
        }

        if (Boolean.TRUE.equals(soloDisponibles)) {
            return resultado.stream().filter(CupoDiarioResponseDTO::getDisponible).toList();
        }
        return resultado;
    }
}
