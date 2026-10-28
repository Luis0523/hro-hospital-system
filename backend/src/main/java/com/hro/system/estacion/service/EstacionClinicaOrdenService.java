package com.hro.system.estacion.service;

import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.estacion.dto.ClinicaOrdenDTO;
import com.hro.system.estacion.entity.EstacionClinicaOrden;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionClinicaOrdenRepository;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstacionClinicaOrdenService {

    private final EstacionClinicaOrdenRepository repository;
    private final EstacionEnfermeriaRepository estacionRepository;
    private final EspacioFisicoRepository espacioFisicoRepository;

    @Transactional(readOnly = true)
    public List<ClinicaOrdenDTO> listar(Long estacionId, Short nivel) {
        EstacionEnfermeria estacion = estacion(estacionId);
        Map<UUID, Integer> ordenes = ordenesPorEspacio(estacion.getId());
        return ordenar(espacios(nivel), ordenes);
    }

    @Transactional
    public List<ClinicaOrdenDTO> reemplazar(Long estacionId, List<UUID> espacioFisicoIds) {
        EstacionEnfermeria estacion = estacion(estacionId);
        List<UUID> ids = espacioFisicoIds != null ? espacioFisicoIds : List.of();

        List<EspacioFisico> espacios = new ArrayList<>();
        for (UUID id : ids) {
            EspacioFisico espacio = espacioFisicoRepository.findById(id)
                    .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                    .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", id));
            espacios.add(espacio);
        }

        repository.deleteByEstacionId(estacion.getId());
        repository.flush();

        OffsetDateTime ahora = OffsetDateTime.now();
        List<EstacionClinicaOrden> filas = new ArrayList<>();
        for (int indice = 0; indice < espacios.size(); indice += 1) {
            filas.add(EstacionClinicaOrden.builder()
                    .estacion(estacion)
                    .espacioFisico(espacios.get(indice))
                    .orden(indice + 1)
                    .actualizadoEn(ahora)
                    .build());
        }
        repository.saveAll(filas);
        return listar(estacion.getId(), null);
    }

    private List<ClinicaOrdenDTO> ordenar(List<EspacioFisico> espacios,
                                          Map<UUID, Integer> ordenes) {
        List<EspacioFisico> ordenados = new ArrayList<>(espacios);
        ordenados.sort(Comparator.comparing(EstacionClinicaOrdenService::claveNatural));
        ordenados.sort(Comparator.comparing(
                espacio -> ordenes.getOrDefault(espacio.getId(), Integer.MAX_VALUE)));

        List<ClinicaOrdenDTO> resultado = new ArrayList<>();
        for (int indice = 0; indice < ordenados.size(); indice += 1) {
            EspacioFisico espacio = ordenados.get(indice);
            resultado.add(ClinicaOrdenDTO.builder()
                    .espacioFisicoId(espacio.getId())
                    .numero(espacio.getNumero())
                    .nombre(espacio.getNombre())
                    .nivel(espacio.getNivel())
                    .orden(indice + 1)
                    .build());
        }
        return resultado;
    }

    private Map<UUID, Integer> ordenesPorEspacio(Long estacionId) {
        return repository.findByEstacionIdOrderByOrdenAscIdAsc(estacionId).stream()
                .collect(Collectors.toMap(
                        fila -> fila.getEspacioFisico().getId(),
                        EstacionClinicaOrden::getOrden,
                        (anterior, actual) -> actual,
                        java.util.LinkedHashMap::new));
    }

    private List<EspacioFisico> espacios(Short nivel) {
        return nivel != null
                ? espacioFisicoRepository.findByNivelAndActivoTrue(nivel)
                : espacioFisicoRepository.findByActivoTrue();
    }

    private EstacionEnfermeria estacion(Long estacionId) {
        return estacionRepository.findById(estacionId)
                .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("EstacionEnfermeria", "id", estacionId));
    }

    private static String claveNatural(EspacioFisico espacio) {
        String valor = espacio.getNumero() != null ? espacio.getNumero() : espacio.getNombre();
        return valor == null ? "" : valor.toLowerCase(Locale.ROOT);
    }
}
