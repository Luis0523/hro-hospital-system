package com.hro.system.estacion.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.estacion.dto.ActualizarEstacionRequestDTO;
import com.hro.system.estacion.dto.CrearEstacionRequestDTO;
import com.hro.system.estacion.dto.EstacionAccesoResponseDTO;
import com.hro.system.estacion.dto.EstacionResponseDTO;
import com.hro.system.estacion.dto.SubespecialidadAsignadaDTO;
import com.hro.system.estacion.entity.EstacionAcceso;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.entity.EstacionSubespecialidad;
import com.hro.system.estacion.repository.EstacionAccesoRepository;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.estacion.repository.EstacionSubespecialidadRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gestión de estaciones de enfermería y de las subespecialidades que tienen a cargo.
 * La estación es un agrupador: la agenda, la cola y el tablero se derivan de sus
 * subespecialidades (sin duplicar datos operativos).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EstacionService {

    private final EstacionEnfermeriaRepository estacionRepository;
    private final EstacionSubespecialidadRepository estacionSubRepository;
    private final EstacionAccesoRepository accesoRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final SubespecialidadHorarioRepository horarioRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public EstacionResponseDTO crear(CrearEstacionRequestDTO dto) {
        String codigo = dto.getCodigo().trim();
        if (estacionRepository.existsByCodigoIgnoreCase(codigo)) {
            throw new BusinessException("Ya existe una estación con el código " + codigo);
        }

        EstacionEnfermeria estacion = EstacionEnfermeria.builder()
                .codigo(codigo)
                .nombre(dto.getNombre().trim())
                .ubicacion(trimToNull(dto.getUbicacion()))
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build();

        EstacionEnfermeria guardada = estacionRepository.save(estacion);
        auditar("crear", guardada.getId(), null, guardada);
        log.info("Estación de enfermería creada: {} ({})", guardada.getCodigo(), guardada.getNombre());
        return toDTO(guardada);
    }

    @Transactional
    public EstacionResponseDTO actualizar(Long id, ActualizarEstacionRequestDTO dto) {
        EstacionEnfermeria estacion = buscarEntidad(id);
        String codigo = dto.getCodigo().trim();
        if (estacionRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, id)) {
            throw new BusinessException("Ya existe otra estación con el código " + codigo);
        }

        estacion.setCodigo(codigo);
        estacion.setNombre(dto.getNombre().trim());
        estacion.setUbicacion(trimToNull(dto.getUbicacion()));
        if (dto.getActivo() != null) {
            estacion.setActivo(dto.getActivo());
        }

        EstacionEnfermeria guardada = estacionRepository.save(estacion);
        auditar("actualizar", guardada.getId(), null, guardada);
        return toDTO(guardada);
    }

    @Transactional
    public EstacionResponseDTO cambiarEstado(Long id, boolean activo) {
        EstacionEnfermeria estacion = buscarEntidad(id);
        if (Boolean.valueOf(activo).equals(estacion.getActivo())) {
            return toDTO(estacion);
        }
        estacion.setActivo(activo);
        EstacionEnfermeria guardada = estacionRepository.save(estacion);
        auditar("actualizar", guardada.getId(), null, Map.of("activo", activo));
        log.info("Estación {} {}", guardada.getCodigo(), activo ? "reactivada" : "desactivada");
        return toDTO(guardada);
    }

    @Transactional
    public EstacionResponseDTO reactivar(Long id) {
        return cambiarEstado(id, true);
    }

    @Transactional
    public EstacionResponseDTO desactivar(Long id) {
        return cambiarEstado(id, false);
    }

    @Transactional(readOnly = true)
    public List<EstacionResponseDTO> listar(Boolean activo) {
        List<EstacionEnfermeria> estaciones = (activo == null)
                ? estacionRepository.findAllByOrderByCodigoAsc()
                : estacionRepository.findByActivoOrderByCodigoAsc(activo);
        return estaciones.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public EstacionResponseDTO buscarPorId(Long id) {
        return toDTO(buscarEntidad(id));
    }

    @Transactional(readOnly = true)
    public List<SubespecialidadAsignadaDTO> listarSubespecialidades(Long id) {
        EstacionEnfermeria estacion = buscarEntidad(id);
        return estacionSubRepository.findByEstacionIdAndActivoTrue(estacion.getId()).stream()
                .map(this::toSubDTO)
                .toList();
    }

    /**
     * Subespecialidades de la estación con horario activo para la fecha indicada
     * (si {@code fecha} es nula, devuelve todas las asignadas).
     */
    @Transactional(readOnly = true)
    public List<SubespecialidadAsignadaDTO> listarSubespecialidadesActivas(Long id, LocalDate fecha) {
        EstacionEnfermeria estacion = buscarEntidad(id);
        List<EstacionSubespecialidad> asignadas = estacionSubRepository.findByEstacionIdAndActivoTrue(estacion.getId());
        if (asignadas.isEmpty() || fecha == null) {
            return asignadas.stream().map(this::toSubDTO).toList();
        }
        short diaSemana = (short) fecha.getDayOfWeek().getValue();
        List<Long> ids = asignadas.stream().map(a -> a.getSubespecialidad().getId()).toList();
        Set<Long> activasHoy = horarioRepository
                .findBySubespecialidadIdInAndDiaSemanaAndActivoTrue(ids, diaSemana).stream()
                .map(h -> h.getSubespecialidad().getId())
                .collect(Collectors.toSet());
        return asignadas.stream()
                .filter(a -> activasHoy.contains(a.getSubespecialidad().getId()))
                .map(this::toSubDTO)
                .toList();
    }

    /**
     * Reemplaza el conjunto de subespecialidades de la estación.
     * Valida pertenencia única: ninguna subespecialidad puede estar en otra estación.
     */
    @Transactional
    public EstacionResponseDTO asignarSubespecialidades(Long id, List<Long> subespecialidadIds) {
        EstacionEnfermeria estacion = buscarEntidad(id);

        List<Long> ids = subespecialidadIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            throw new BusinessException("Debe indicar al menos una subespecialidad.");
        }

        Map<Long, Subespecialidad> seleccionadas = new LinkedHashMap<>();
        for (Long subId : ids) {
            Subespecialidad sub = subespecialidadRepository.findById(subId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", subId));
            if (!Boolean.TRUE.equals(sub.getActivo())) {
                throw new BusinessException("La subespecialidad '" + sub.getNombre() + "' está inactiva.");
            }
            estacionSubRepository.findBySubespecialidadId(subId).ifPresent(actual -> {
                if (!actual.getEstacion().getId().equals(estacion.getId())) {
                    throw new BusinessException("SUBSESPECIALIDAD_YA_ASIGNADA",
                            "La subespecialidad '" + sub.getNombre() + "' ya pertenece a la estación '"
                                    + actual.getEstacion().getNombre() + "'.");
                }
            });
            seleccionadas.put(subId, sub);
        }

        estacionSubRepository.deleteByEstacionId(estacion.getId());
        estacionSubRepository.flush();

        List<EstacionSubespecialidad> nuevas = seleccionadas.values().stream()
                .map(sub -> EstacionSubespecialidad.builder()
                        .estacion(estacion)
                        .subespecialidad(sub)
                        .activo(true)
                        .creadoEn(OffsetDateTime.now())
                        .build())
                .toList();
        estacionSubRepository.saveAll(nuevas);

        auditar("actualizar", estacion.getId(), null, Map.of("subespecialidadIds", seleccionadas.keySet()));
        log.info("Estación {} ahora tiene {} subespecialidades", estacion.getCodigo(), nuevas.size());
        return toDTO(estacion);
    }

    /**
     * Registra la entrada del usuario autenticado a la estación (rotación de personal).
     * Cierra cualquier acceso abierto previo del usuario para dejar una sola estación activa.
     */
    @Transactional
    public EstacionAccesoResponseDTO registrarAcceso(Long estacionId) {
        EstacionEnfermeria estacion = buscarEntidad(estacionId);
        Long usuarioId = UsuarioContexto.idActual();
        UsuarioReferencia usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));

        OffsetDateTime ahora = OffsetDateTime.now();
        List<EstacionAcceso> abiertos = accesoRepository.findByUsuarioReferenciaIdAndSalidoEnIsNull(usuarioId);
        abiertos.forEach(a -> a.setSalidoEn(ahora));
        if (!abiertos.isEmpty()) {
            accesoRepository.saveAll(abiertos);
        }

        EstacionAcceso acceso = EstacionAcceso.builder()
                .estacion(estacion)
                .usuarioReferencia(usuario)
                .entradoEn(ahora)
                .build();
        EstacionAcceso guardado = accesoRepository.save(acceso);

        auditar("crear", estacion.getId(), null,
                Map.of("accesoId", guardado.getId(), "usuarioId", usuarioId, "estacionCodigo", estacion.getCodigo()));
        log.info("Usuario {} entró a la estación {}", usuario.getNombreMostrar(), estacion.getCodigo());
        return toAccesoDTO(guardado);
    }

    /** Marca la salida de un acceso (fin de turno en la estación). */
    @Transactional
    public EstacionAccesoResponseDTO cerrarAcceso(Long accesoId) {
        EstacionAcceso acceso = accesoRepository.findById(accesoId)
                .orElseThrow(() -> new ResourceNotFoundException("EstacionAcceso", "id", accesoId));
        if (acceso.getSalidoEn() == null) {
            acceso.setSalidoEn(OffsetDateTime.now());
            acceso = accesoRepository.save(acceso);
        }
        return toAccesoDTO(acceso);
    }

    @Transactional(readOnly = true)
    public List<EstacionAccesoResponseDTO> listarAccesos(Long estacionId, Boolean soloAbiertos) {
        EstacionEnfermeria estacion = buscarEntidad(estacionId);
        List<EstacionAcceso> accesos = Boolean.TRUE.equals(soloAbiertos)
                ? accesoRepository.findByEstacionIdAndSalidoEnIsNull(estacion.getId())
                : accesoRepository.findByEstacionIdOrderByEntradoEnDesc(estacion.getId());
        return accesos.stream().map(this::toAccesoDTO).toList();
    }

    // ------------------------------------------------------------------

    private EstacionEnfermeria buscarEntidad(Long id) {
        return estacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EstacionEnfermeria", "id", id));
    }

    private void auditar(String accion, Long id, Object anteriores, Object nuevos) {
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("estacion_enfermeria")
                .entidadId(id)
                .accion(accion)
                .usuarioReferenciaId(UsuarioContexto.actual().map(IdentidadUsuario::id).orElse(null))
                .valoresAnteriores(anteriores)
                .valoresNuevos(nuevos)
                .build());
    }

    private EstacionResponseDTO toDTO(EstacionEnfermeria e) {
        List<SubespecialidadAsignadaDTO> subs = estacionSubRepository
                .findByEstacionIdAndActivoTrue(e.getId()).stream()
                .map(this::toSubDTO)
                .toList();
        return EstacionResponseDTO.builder()
                .id(e.getId())
                .codigo(e.getCodigo())
                .nombre(e.getNombre())
                .ubicacion(e.getUbicacion())
                .activo(e.getActivo())
                .creadoEn(e.getCreadoEn())
                .subespecialidades(subs)
                .build();
    }

    private SubespecialidadAsignadaDTO toSubDTO(EstacionSubespecialidad asignacion) {
        Subespecialidad sub = asignacion.getSubespecialidad();
        return SubespecialidadAsignadaDTO.builder()
                .id(sub.getId())
                .nombre(sub.getNombre())
                .especialidadId(sub.getEspecialidad().getId())
                .especialidadNombre(sub.getEspecialidad().getNombre())
                .build();
    }

    private String trimToNull(String valor) {
        if (valor == null) {
            return null;
        }
        String t = valor.trim();
        return t.isEmpty() ? null : t;
    }

    private EstacionAccesoResponseDTO toAccesoDTO(EstacionAcceso a) {
        return EstacionAccesoResponseDTO.builder()
                .id(a.getId())
                .estacionId(a.getEstacion().getId())
                .estacionCodigo(a.getEstacion().getCodigo())
                .usuarioReferenciaId(a.getUsuarioReferencia().getId())
                .usuarioNombre(a.getUsuarioReferencia().getNombreMostrar())
                .entradoEn(a.getEntradoEn())
                .salidoEn(a.getSalidoEn())
                .build();
    }
}
