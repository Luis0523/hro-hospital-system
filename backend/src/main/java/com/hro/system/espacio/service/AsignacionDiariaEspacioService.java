package com.hro.system.espacio.service;

import com.hro.system.auditoria.event.AuditoriaEvent;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.espacio.dto.AsignacionDiariaResponseDTO;
import com.hro.system.espacio.dto.AsignacionVistaItemDTO;
import com.hro.system.espacio.dto.CoberturaFaltanteDTO;
import com.hro.system.espacio.dto.CrearAsignacionDiariaRequestDTO;
import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import com.hro.system.espacio.entity.CierreAsignacionDiaria;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.espacio.repository.CierreAsignacionDiariaRepository;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.UUID;

/**
 * Asignación diaria de subespecialidades a espacios físicos y cierre de jornada.
 * <p>
 * Reglas:
 * <ul>
 *   <li>Mientras el día está {@code abierta}, se puede crear/editar/eliminar libremente.</li>
 *   <li>Al {@code cerrar} se exige cobertura completa (toda subespecialidad con médicos programados
 *       ese día debe tener un espacio asignado).</li>
 *   <li>Tras el cierre, solo se permite una "reasignación en caliente" explícita y auditada.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AsignacionDiariaEspacioService {

    private final AsignacionDiariaEspacioRepository asignacionRepository;
    private final CierreAsignacionDiariaRepository cierreRepository;
    private final EspacioFisicoRepository espacioFisicoRepository;
    private final SubespecialidadRepository subespecialidadRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public AsignacionDiariaResponseDTO crear(CrearAsignacionDiariaRequestDTO dto) {
        validarDiaAbierto(dto.getFecha());

        EspacioFisico espacio = espacioFisicoRepository.findById(dto.getEspacioFisicoId())
                .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", dto.getEspacioFisicoId()));
        if (!Boolean.TRUE.equals(espacio.getActivo())) {
            throw new BusinessException("El espacio físico " + espacio.getNumero() + " está fuera de servicio.");
        }

        Subespecialidad sub = subespecialidadRepository.findById(dto.getSubespecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", dto.getSubespecialidadId()));
        validarSubespecialidadActiva(sub);

        if (asignacionRepository.existsByEspacioFisicoIdAndFecha(espacio.getId(), dto.getFecha())) {
            throw new BusinessException("El espacio " + espacio.getNumero() + " ya tiene una subespecialidad asignada el " + dto.getFecha() + ".");
        }

        UsuarioReferencia usuario = usuarioActual();

        AsignacionDiariaEspacio asignacion = AsignacionDiariaEspacio.builder()
                .espacioFisico(espacio)
                .subespecialidad(sub)
                .fecha(dto.getFecha())
                .creadoPor(usuario)
                .creadoEn(OffsetDateTime.now())
                .build();

        AsignacionDiariaEspacio guardada = asignacionRepository.save(asignacion);
        publicarAuditoria("crear", guardada, usuario, Map.of(
                "espacioFisicoId", espacio.getId(),
                "subespecialidadId", sub.getId(),
                "fecha", dto.getFecha().toString()));

        log.info("Asignación diaria: {} -> {} el {}", espacio.getNumero(), sub.getNombre(), dto.getFecha());
        return mapToDTO(guardada);
    }

    /**
     * Upsert de la selección de subespecialidad de una sala en una fecha:
     * crea la asignación si no existe o actualiza la subespecialidad si ya existe.
     * Pensado para el &lt;select&gt; del panel del jefe de enfermería.
     */
    @Transactional
    public AsignacionDiariaResponseDTO upsert(CrearAsignacionDiariaRequestDTO dto) {
        validarDiaAbierto(dto.getFecha());

        EspacioFisico espacio = espacioFisicoRepository.findById(dto.getEspacioFisicoId())
                .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", dto.getEspacioFisicoId()));
        if (!Boolean.TRUE.equals(espacio.getActivo())) {
            throw new BusinessException("El espacio físico " + espacio.getNumero() + " está fuera de servicio.");
        }

        Subespecialidad sub = subespecialidadRepository.findById(dto.getSubespecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Subespecialidad", "id", dto.getSubespecialidadId()));
        validarSubespecialidadActiva(sub);

        UsuarioReferencia usuario = usuarioActual();
        Optional<AsignacionDiariaEspacio> existente =
                asignacionRepository.findByEspacioFisicoIdAndFecha(espacio.getId(), dto.getFecha());

        AsignacionDiariaEspacio asignacion;
        String accion;
        if (existente.isPresent()) {
            asignacion = existente.get();
            if (asignacion.getSubespecialidad().getId().equals(sub.getId())) {
                return mapToDTO(asignacion);
            }
            asignacion.setSubespecialidad(sub);
            accion = "actualizar";
        } else {
            asignacion = AsignacionDiariaEspacio.builder()
                    .espacioFisico(espacio)
                    .subespecialidad(sub)
                    .fecha(dto.getFecha())
                    .creadoPor(usuario)
                    .creadoEn(OffsetDateTime.now())
                    .build();
            accion = "crear";
        }

        AsignacionDiariaEspacio guardada = asignacionRepository.save(asignacion);
        publicarAuditoria(accion, guardada, usuario, Map.of(
                "espacioFisicoId", espacio.getId(),
                "subespecialidadId", sub.getId(),
                "fecha", dto.getFecha().toString()));

        log.info("Selección de sala {} -> {} el {} ({})", espacio.getNumero(), sub.getNombre(), dto.getFecha(), accion);
        return mapToDTO(guardada);
    }

    /**
     * Vista operativa: todas las salas activas (del nivel indicado, o todas) con la
     * subespecialidad seleccionada para la fecha (o nula si aún no se seleccionó).
     */
    @Transactional(readOnly = true)
    public List<AsignacionVistaItemDTO> vista(LocalDate fecha, Short nivel) {
        List<EspacioFisico> espacios = (nivel != null)
                ? espacioFisicoRepository.findByNivelAndActivoTrue(nivel)
                : espacioFisicoRepository.findByActivoTrue();

        Map<UUID, AsignacionDiariaEspacio> porEspacio = asignacionRepository.findByFecha(fecha).stream()
                .collect(Collectors.toMap(a -> a.getEspacioFisico().getId(), a -> a, (a, b) -> a));

        return espacios.stream().map(espacio -> {
            AsignacionDiariaEspacio a = porEspacio.get(espacio.getId());
            return AsignacionVistaItemDTO.builder()
                    .espacioFisicoId(espacio.getId())
                    .numero(espacio.getNumero())
                    .nivel(espacio.getNivel())
                    .capacidadCamillas(espacio.getCapacidadCamillas())
                    .asignacionId(a != null ? a.getId() : null)
                    .subespecialidadId(a != null ? a.getSubespecialidad().getId() : null)
                    .subespecialidadNombre(a != null ? a.getSubespecialidad().getNombre() : null)
                    .especialidadId(a != null ? a.getSubespecialidad().getEspecialidad().getId() : null)
                    .especialidadNombre(a != null ? a.getSubespecialidad().getEspecialidad().getNombre() : null)
                    .build();
        }).toList();
    }

    @Transactional
    public void eliminar(Long id) {
        AsignacionDiariaEspacio asignacion = asignacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AsignacionDiariaEspacio", "id", id));
        validarDiaAbierto(asignacion.getFecha());
        asignacionRepository.delete(asignacion);
    }

    /**
     * Reasignación en caliente: única vía para modificar una fecha ya cerrada
     * (por ejemplo, una emergencia que obliga a mover una especialidad). Queda auditada.
     */
    @Transactional
    public AsignacionDiariaResponseDTO reasignarEnCaliente(Long id, UUID nuevoEspacioFisicoId, String motivo) {
        AsignacionDiariaEspacio asignacion = asignacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AsignacionDiariaEspacio", "id", id));
        EspacioFisico nuevoEspacio = espacioFisicoRepository.findById(nuevoEspacioFisicoId)
                .orElseThrow(() -> new ResourceNotFoundException("EspacioFisico", "id", nuevoEspacioFisicoId));

        if (asignacionRepository.existsByEspacioFisicoIdAndFecha(nuevoEspacio.getId(), asignacion.getFecha())) {
            throw new BusinessException("El espacio " + nuevoEspacio.getNumero() + " ya está ocupado el " + asignacion.getFecha() + ".");
        }

        UUID anterior = asignacion.getEspacioFisico().getId();
        asignacion.setEspacioFisico(nuevoEspacio);
        AsignacionDiariaEspacio guardada = asignacionRepository.save(asignacion);

        UsuarioReferencia usuario = usuarioActual();
        publicarAuditoria("actualizar", guardada, usuario, Map.of(
                "motivo", motivo != null ? motivo : "Reasignación en caliente",
                "espacioFisicoAnteriorId", anterior,
                "espacioFisicoNuevoId", nuevoEspacio.getId()));
        log.warn("Reasignación en caliente de la asignación {}: {} -> {}", id, anterior, nuevoEspacio.getId());
        return mapToDTO(guardada);
    }

    @Transactional(readOnly = true)
    public List<AsignacionDiariaResponseDTO> listarPorFecha(LocalDate fecha) {
        return asignacionRepository.findByFecha(fecha).stream().map(this::mapToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<CoberturaFaltanteDTO> verificarCobertura(LocalDate fecha) {
        return asignacionRepository.subespecialidadesSinAsignar(fecha).stream()
                .map(row -> CoberturaFaltanteDTO.builder()
                        .subespecialidadId(((Number) row[0]).longValue())
                        .subespecialidadNombre((String) row[1])
                        .build())
                .toList();
    }

    @Transactional
    public void cerrarDia(LocalDate fecha) {
        List<CoberturaFaltanteDTO> faltantes = verificarCobertura(fecha);
        if (!faltantes.isEmpty()) {
            String detalle = faltantes.stream()
                    .map(CoberturaFaltanteDTO::getSubespecialidadNombre)
                    .collect(Collectors.joining(", "));
            throw new BusinessException("No se puede cerrar el día " + fecha
                    + ": faltan asignar espacios para las subespecialidades: " + detalle);
        }

        UsuarioReferencia usuario = usuarioActual();
        CierreAsignacionDiaria cierre = cierreRepository.findById(fecha)
                .orElseGet(() -> CierreAsignacionDiaria.builder().fecha(fecha).build());
        cierre.setEstado("cerrada");
        cierre.setConfirmadoPor(usuario);
        cierre.setConfirmadoEn(OffsetDateTime.now());
        cierreRepository.save(cierre);

        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("cierre_asignacion_diaria")
                .entidadId(0L)
                .accion("actualizar")
                .usuarioReferenciaId(usuario.getId())
                .valoresNuevos(Map.of("fecha", fecha.toString(), "estado", "cerrada"))
                .build());
        log.info("Cierre de asignación diaria confirmado para {}", fecha);
    }

    /**
     * Atajo de UX: copia la asignación de una fecha origen hacia la fecha destino
     * (editable después por el jefe de enfermería). No sobrescribe espacios ya asignados.
     */
    @Transactional
    public int duplicarDesde(LocalDate fechaOrigen, LocalDate fechaDestino) {
        validarDiaAbierto(fechaDestino);
        UsuarioReferencia usuario = usuarioActual();
        int copiadas = 0;
        for (AsignacionDiariaEspacio origen : asignacionRepository.findByFecha(fechaOrigen)) {
            if (asignacionRepository.existsByEspacioFisicoIdAndFecha(origen.getEspacioFisico().getId(), fechaDestino)) {
                continue;
            }
            asignacionRepository.save(AsignacionDiariaEspacio.builder()
                    .espacioFisico(origen.getEspacioFisico())
                    .subespecialidad(origen.getSubespecialidad())
                    .fecha(fechaDestino)
                    .creadoPor(usuario)
                    .creadoEn(OffsetDateTime.now())
                    .build());
            copiadas++;
        }
        log.info("Duplicadas {} asignaciones de {} hacia {}", copiadas, fechaOrigen, fechaDestino);
        return copiadas;
    }

    private void validarDiaAbierto(LocalDate fecha) {
        cierreRepository.findById(fecha)
                .filter(c -> "cerrada".equalsIgnoreCase(c.getEstado()))
                .ifPresent(c -> {
                    throw new BusinessException("La asignación del " + fecha
                            + " ya fue cerrada. Para cambiarla use una reasignación en caliente.");
                });
    }

    private void validarSubespecialidadActiva(Subespecialidad sub) {
        if (!Boolean.TRUE.equals(sub.getActivo())) {
            throw new BusinessException("La subespecialidad " + sub.getNombre() + " está inactiva y no puede asignarse.");
        }
        if (sub.getEspecialidad() != null && !Boolean.TRUE.equals(sub.getEspecialidad().getActivo())) {
            throw new BusinessException("La especialidad " + sub.getEspecialidad().getNombre()
                    + " está inactiva: no se puede asignar una de sus subespecialidades.");
        }
    }

    private UsuarioReferencia usuarioActual() {
        Long usuarioId = UsuarioContexto.idActual();
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));
    }

    private void publicarAuditoria(String accion, AsignacionDiariaEspacio asignacion, UsuarioReferencia usuario, Map<String, Object> valoresNuevos) {
        eventPublisher.publishEvent(AuditoriaEvent.builder()
                .tablaAfectada("asignacion_diaria_espacio")
                .entidadId(asignacion.getId())
                .accion(accion)
                .usuarioReferenciaId(usuario.getId())
                .valoresNuevos(valoresNuevos)
                .build());
    }

    private AsignacionDiariaResponseDTO mapToDTO(AsignacionDiariaEspacio a) {
        return AsignacionDiariaResponseDTO.builder()
                .id(a.getId())
                .fecha(a.getFecha())
                .espacioFisicoId(a.getEspacioFisico().getId())
                .espacioNumero(a.getEspacioFisico().getNumero())
                .nivel(a.getEspacioFisico().getNivel())
                .subespecialidadId(a.getSubespecialidad().getId())
                .subespecialidadNombre(a.getSubespecialidad().getNombre())
                .especialidadId(a.getSubespecialidad().getEspecialidad().getId())
                .especialidadNombre(a.getSubespecialidad().getEspecialidad().getNombre())
                .build();
    }
}
