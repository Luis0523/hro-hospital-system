package com.hro.system.estacion.service;

import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.estacion.dto.EspecialidadOrdenDTO;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.entity.EstacionEspecialidadOrden;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.estacion.repository.EstacionEspecialidadOrdenRepository;
import com.hro.system.estacion.repository.EstacionSubespecialidadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstacionEspecialidadOrdenService {

    private final EstacionEspecialidadOrdenRepository repository;
    private final EstacionEnfermeriaRepository estacionRepository;
    private final EstacionSubespecialidadRepository estacionSubespecialidadRepository;

    @Transactional(readOnly = true)
    public List<EspecialidadOrdenDTO> listar(Long estacionId) {
        EstacionEnfermeria estacion = estacion(estacionId);
        return ordenar(
                especialidadesAsignadas(estacion.getId()),
                ordenesPorEspecialidad(estacion.getId()));
    }

    @Transactional
    public List<EspecialidadOrdenDTO> reemplazar(Long estacionId, List<Long> especialidadIds) {
        EstacionEnfermeria estacion = estacion(estacionId);
        Map<Long, Especialidad> asignadas = especialidadesAsignadas(estacion.getId()).stream()
                .collect(Collectors.toMap(
                        Especialidad::getId,
                        especialidad -> especialidad,
                        (anterior, actual) -> anterior,
                        LinkedHashMap::new));

        List<Long> ids = (especialidadIds != null ? especialidadIds : List.<Long>of()).stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        for (Long especialidadId : ids) {
            if (!asignadas.containsKey(especialidadId)) {
                throw new BusinessException(
                        "ESPECIALIDAD_NO_ASIGNADA",
                        "La especialidad " + especialidadId + " no está asignada a la estación");
            }
        }

        repository.deleteByEstacionId(estacion.getId());
        repository.flush();

        OffsetDateTime ahora = OffsetDateTime.now();
        List<EstacionEspecialidadOrden> filas = new ArrayList<>();
        for (int indice = 0; indice < ids.size(); indice += 1) {
            filas.add(EstacionEspecialidadOrden.builder()
                    .estacion(estacion)
                    .especialidad(asignadas.get(ids.get(indice)))
                    .orden(indice + 1)
                    .actualizadoEn(ahora)
                    .build());
        }
        repository.saveAll(filas);
        return listar(estacion.getId());
    }

    @Transactional(readOnly = true)
    public Map<Long, Integer> ordenesPorEspecialidad(Long estacionId) {
        return repository.findByEstacionIdOrderByOrdenAscIdAsc(estacionId).stream()
                .collect(Collectors.toMap(
                        fila -> fila.getEspecialidad().getId(),
                        EstacionEspecialidadOrden::getOrden,
                        (anterior, actual) -> actual,
                        LinkedHashMap::new));
    }

    @Transactional(readOnly = true)
    public List<EspecialidadOrdenDTO> ordenar(
            List<Especialidad> especialidades, Map<Long, Integer> ordenes) {
        List<Especialidad> ordenadas = new ArrayList<>(especialidades);
        ordenadas.sort(Comparator.comparingInt(
                especialidad -> ordenes.getOrDefault(especialidad.getId(), Integer.MAX_VALUE)));

        List<EspecialidadOrdenDTO> resultado = new ArrayList<>();
        for (int indice = 0; indice < ordenadas.size(); indice += 1) {
            Especialidad especialidad = ordenadas.get(indice);
            resultado.add(EspecialidadOrdenDTO.builder()
                    .especialidadId(especialidad.getId())
                    .nombre(especialidad.getNombre())
                    .abreviatura(especialidad.getAbreviatura())
                    .orden(indice + 1)
                    .build());
        }
        return resultado;
    }

    private List<Especialidad> especialidadesAsignadas(Long estacionId) {
        Map<Long, Especialidad> porEspecialidad = new LinkedHashMap<>();
        estacionSubespecialidadRepository.findByEstacionIdAndActivoTrueOrderByIdAsc(estacionId)
                .forEach(asignacion -> {
                    if (asignacion.getSubespecialidad() == null
                            || asignacion.getSubespecialidad().getEspecialidad() == null) {
                        return;
                    }
                    Especialidad especialidad = asignacion.getSubespecialidad().getEspecialidad();
                    if (!Boolean.TRUE.equals(especialidad.getActivo())) {
                        return;
                    }
                    porEspecialidad.putIfAbsent(especialidad.getId(), especialidad);
                });
        return new ArrayList<>(porEspecialidad.values());
    }

    private EstacionEnfermeria estacion(Long estacionId) {
        return estacionRepository.findById(estacionId)
                .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "EstacionEnfermeria", "id", estacionId));
    }
}
