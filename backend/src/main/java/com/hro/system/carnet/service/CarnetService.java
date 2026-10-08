package com.hro.system.carnet.service;

import com.hro.system.auth.UsuarioContexto;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.carnet.config.CarnetProperties;
import com.hro.system.carnet.dto.*;
import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.entity.CarnetMovimiento;
import com.hro.system.carnet.repository.CarnetMovimientoRepository;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.estacion.context.EstacionContexto;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.service.ExpedienteHroService;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Circuito digital del carnet (Fase 1 Archivo/Enfermería).
 * <p>
 * Enfermería registra el carnet (consulta el expediente en el API del hospital y
 * asigna correlativo diario por especialidad); Archivo marca encontrado/no
 * localizado y despacha; enfermería recibe y devuelve; Archivo confirma la
 * devolución. Es agnóstico de la UI: la recepción/devolución se ejecuta desde
 * Mesa COEX, que consume estos endpoints.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CarnetService {

    public static final String REGISTRADO = "registrado";
    public static final String ENCONTRADO = "encontrado";
    public static final String NO_LOCALIZADO = "no_localizado";
    public static final String DESPACHADO = "despachado";
    public static final String RECIBIDO_ESTACION = "recibido_estacion";
    public static final String DEVUELTO_ESTACION = "devuelto_estacion";
    public static final String RECIBIDO_ARCHIVO = "recibido_archivo";

    private static final Set<String> ROLES_ARCHIVO = Set.of("archivo", "administrador");
    private static final Set<String> ROLES_ENFERMERIA = Set.of("enfermeria", "administrador");

    /**
     * Zona horaria del hospital. La "fecha del carnet" debe ser el día operativo
     * local (Guatemala, UTC-6), no el día UTC del servidor: de lo contrario, los
     * carnets registrados después de las 18:00 locales caen en el día siguiente
     * y no aparecen en el filtro del día del frontend.
     */
    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    private final CarnetRepository carnetRepository;
    private final CarnetMovimientoRepository movimientoRepository;
    private final EspecialidadRepository especialidadRepository;
    private final EstacionEnfermeriaRepository estacionRepository;
    private final UsuarioReferenciaRepository usuarioRepository;
    private final ExpedienteHroService expedienteHroService;
    private final CarnetProperties properties;
    private final SimpMessagingTemplate messagingTemplate;

    // ------------------------------------------------------------------
    // Registro
    // ------------------------------------------------------------------

    @Transactional
    public CarnetResponseDTO registrar(RegistrarCarnetRequestDTO dto) {
        Especialidad especialidad = especialidadRepository.findById(dto.getEspecialidadId())
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad", "id", dto.getEspecialidadId()));
        if (Boolean.FALSE.equals(especialidad.getActivo())) {
            throw new BusinessException("La especialidad indicada está inactiva");
        }

        EstacionEnfermeria estacion = resolverEstacion(dto.getEstacionId());

        String numero = dto.getNumeroExpediente().trim();
        LocalDate hoy = LocalDate.now(ZONA_HORARIA);

        Carnet existente = carnetRepository.findByFechaAndNumeroExpediente(hoy, numero).orElse(null);
        if (existente != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("correlativo", existente.getCorrelativo());
            data.put("especialidadId", existente.getEspecialidad().getId());
            throw new ConflictException("CARNET_DUPLICADO",
                    "Este expediente ya fue registrado hoy. Correlativo: " + existente.getCorrelativo(), data);
        }

        // 404 si el expediente no existe en el API del hospital (y no se crea el carnet).
        PacienteHroDTO paciente = expedienteHroService.consultar(numero);

        int correlativo = carnetRepository.obtenerSiguienteCorrelativo(hoy, especialidad.getId());
        UsuarioReferencia usuario = usuarioActual();
        OffsetDateTime ahora = OffsetDateTime.now();

        Carnet carnet = carnetRepository.save(Carnet.builder()
                .fecha(hoy)
                .correlativo(correlativo)
                .especialidad(especialidad)
                .estacion(estacion)
                .numeroExpediente(numero)
                .pacienteNombre(paciente.getNombreCompleto())
                .estado(REGISTRADO)
                .registradoPor(usuario)
                .registradoEn(ahora)
                .creadoEn(ahora)
                .actualizadoEn(ahora)
                .build());

        registrarMovimiento(carnet, null, REGISTRADO, usuario, null);
        publicar(carnet);

        log.info("Carnet {} registrado (exp {} corr {})", carnet.getId(), numero, correlativo);
        return mapCarnet(carnet);
    }

    // ------------------------------------------------------------------
    // Transiciones
    // ------------------------------------------------------------------

    @Transactional
    public CarnetResponseDTO marcarEncontrado(UUID id) {
        return transicionar(id, ENCONTRADO, Set.of(REGISTRADO, NO_LOCALIZADO), ROLES_ARCHIVO, null);
    }

    @Transactional
    public CarnetResponseDTO marcarNoLocalizado(UUID id, String observacion) {
        if (observacion == null || observacion.isBlank()) {
            throw new BusinessException("Debe indicar una observación al marcar el carnet como 'no localizado'");
        }
        return transicionar(id, NO_LOCALIZADO, Set.of(REGISTRADO, ENCONTRADO), ROLES_ARCHIVO, observacion);
    }

    @Transactional
    public CarnetResponseDTO despachar(UUID id) {
        return transicionar(id, DESPACHADO, Set.of(ENCONTRADO), ROLES_ARCHIVO, null);
    }

    @Transactional
    public CarnetResponseDTO recibir(UUID id) {
        return transicionar(id, RECIBIDO_ESTACION, Set.of(DESPACHADO), ROLES_ENFERMERIA, null);
    }

    @Transactional
    public CarnetResponseDTO devolver(UUID id) {
        return transicionar(id, DEVUELTO_ESTACION, Set.of(RECIBIDO_ESTACION), ROLES_ENFERMERIA, null);
    }

    @Transactional
    public CarnetResponseDTO recibirDevolucion(UUID id) {
        return transicionar(id, RECIBIDO_ARCHIVO, Set.of(DEVUELTO_ESTACION), ROLES_ARCHIVO, null);
    }

    // ------------------------------------------------------------------
    // Consultas
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CarnetResponseDTO> listar(LocalDate fecha, Long estacionId, Long especialidadId, String estado) {
        LocalDate dia = (fecha != null) ? fecha : LocalDate.now(ZONA_HORARIA);
        String estadoNormalizado = (estado != null && !estado.isBlank()) ? estado.trim() : null;

        return carnetRepository.listarPorFecha(dia).stream()
                .filter(c -> estacionId == null
                        || (c.getEstacion() != null && estacionId.equals(c.getEstacion().getId())))
                .filter(c -> especialidadId == null || especialidadId.equals(c.getEspecialidad().getId()))
                .filter(c -> estadoNormalizado == null || estadoNormalizado.equals(c.getEstado()))
                .map(this::mapCarnet)
                .toList();
    }

    @Transactional(readOnly = true)
    public CarnetResponseDTO obtener(UUID id) {
        return mapCarnet(buscar(id));
    }

    // ------------------------------------------------------------------
    // Apoyo
    // ------------------------------------------------------------------

    private CarnetResponseDTO transicionar(UUID id, String nuevoEstado, Set<String> origenes,
                                           Set<String> roles, String observacion) {
        Carnet carnet = buscar(id);
        validarRol(roles);
        if (!origenes.contains(carnet.getEstado())) {
            throw new BusinessException(String.format(
                    "Transición inválida: no se puede pasar a '%s' desde el estado '%s'", nuevoEstado, carnet.getEstado()));
        }
        if (DEVUELTO_ESTACION.equals(nuevoEstado)) {
            validarGuardDevolucion(carnet);
        }

        UsuarioReferencia usuario = usuarioActual();
        String anterior = carnet.getEstado();
        carnet.setEstado(nuevoEstado);
        carnet.setActualizadoEn(OffsetDateTime.now());
        if (observacion != null) {
            carnet.setObservacion(observacion);
        }
        aplicarHito(carnet, nuevoEstado, usuario);

        Carnet guardado = carnetRepository.save(carnet);
        registrarMovimiento(guardado, anterior, nuevoEstado, usuario, observacion);
        publicar(guardado);
        return mapCarnet(guardado);
    }

    private void aplicarHito(Carnet carnet, String estado, UsuarioReferencia usuario) {
        OffsetDateTime ahora = OffsetDateTime.now();
        switch (estado) {
            case ENCONTRADO -> {
                carnet.setEncontradoPor(usuario);
                carnet.setEncontradoEn(ahora);
            }
            case NO_LOCALIZADO -> {
                carnet.setNoLocalizadoPor(usuario);
                carnet.setNoLocalizadoEn(ahora);
            }
            case DESPACHADO -> {
                carnet.setDespachadoPor(usuario);
                carnet.setDespachadoEn(ahora);
            }
            case RECIBIDO_ESTACION -> {
                carnet.setRecibidoPor(usuario);
                carnet.setRecibidoEn(ahora);
            }
            case DEVUELTO_ESTACION -> {
                carnet.setDevueltoPor(usuario);
                carnet.setDevueltoEn(ahora);
            }
            case RECIBIDO_ARCHIVO -> {
                carnet.setRecibidoArchivoPor(usuario);
                carnet.setRecibidoArchivoEn(ahora);
            }
            default -> { /* estado sin hito específico */ }
        }
    }

    private void validarGuardDevolucion(Carnet carnet) {
        if (carnet.getRecibidoEn() == null) {
            return;
        }
        long transcurridos = Duration.between(carnet.getRecibidoEn(), OffsetDateTime.now()).toMinutes();
        int minimo = properties.getMinutosAntesDeDevolucion();
        if (transcurridos < minimo) {
            long faltan = minimo - transcurridos;
            throw new BusinessException(String.format(
                    "Debe esperar al menos %d min desde la recepción para devolver. Faltan %d min.", minimo, faltan));
        }
    }

    private EstacionEnfermeria resolverEstacion(Long estacionId) {
        Long id = (estacionId != null) ? estacionId : EstacionContexto.idActual().orElse(null);
        if (id == null) {
            return null;
        }
        return estacionRepository.findById(id).orElse(null);
    }

    private Carnet buscar(UUID id) {
        return carnetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Carnet", "id", id));
    }

    private UsuarioReferencia usuarioActual() {
        Long id = UsuarioContexto.idActual();
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", id));
    }

    private void validarRol(Set<String> permitidos) {
        String rol = UsuarioContexto.actual().map(IdentidadUsuario::rolPrincipal).orElse(null);
        if (rol == null || !permitidos.contains(rol)) {
            throw new AccessDeniedException(
                    "El rol '" + rol + "' no está autorizado para esta acción del carnet");
        }
    }

    private void registrarMovimiento(Carnet carnet, String anterior, String nuevo,
                                     UsuarioReferencia usuario, String observacion) {
        movimientoRepository.save(CarnetMovimiento.builder()
                .carnet(carnet)
                .estadoAnterior(anterior)
                .estadoNuevo(nuevo)
                .usuario(usuario)
                .observacion(observacion)
                .fechaMovimiento(OffsetDateTime.now())
                .build());
    }

    private void publicar(Carnet carnet) {
        CarnetResponseDTO dto = mapCarnet(carnet);
        messagingTemplate.convertAndSend("/topic/archivo", dto);
        if (carnet.getEstacion() != null) {
            messagingTemplate.convertAndSend("/topic/estacion/" + carnet.getEstacion().getId(), dto);
        }
    }

    private CarnetResponseDTO mapCarnet(Carnet carnet) {
        String estacionNombre = (carnet.getEstacion() != null) ? carnet.getEstacion().getNombre() : null;
        List<CarnetMovimientoResponseDTO> movimientos = movimientoRepository
                .findByCarnetIdOrderByFechaMovimientoAscIdAsc(carnet.getId()).stream()
                .map(m -> CarnetMovimientoResponseDTO.builder()
                        .id(m.getId())
                        .estadoAnterior(m.getEstadoAnterior())
                        .estadoNuevo(m.getEstadoNuevo())
                        .usuarioNombre(m.getUsuario() != null ? m.getUsuario().getNombreMostrar() : null)
                        .observacion(m.getObservacion())
                        .fechaMovimiento(m.getFechaMovimiento())
                        .build())
                .toList();

        return CarnetResponseDTO.builder()
                .id(carnet.getId())
                .fecha(carnet.getFecha())
                .correlativo(carnet.getCorrelativo())
                .especialidadId(carnet.getEspecialidad().getId())
                .especialidadNombre(carnet.getEspecialidad().getNombre())
                .estacionId(carnet.getEstacion() != null ? carnet.getEstacion().getId() : null)
                .estacionNombre(estacionNombre)
                .numeroExpediente(carnet.getNumeroExpediente())
                .pacienteNombre(carnet.getPacienteNombre())
                .pacienteId(carnet.getPacienteId())
                .expedienteId(carnet.getExpedienteId())
                .citaId(carnet.getCitaId())
                .cicloId(carnet.getCicloId())
                .estado(carnet.getEstado())
                .observacion(carnet.getObservacion())
                .registradoPor(nombre(carnet.getRegistradoPor()))
                .registradoEn(carnet.getRegistradoEn())
                .encontradoPor(nombre(carnet.getEncontradoPor()))
                .encontradoEn(carnet.getEncontradoEn())
                .noLocalizadoPor(nombre(carnet.getNoLocalizadoPor()))
                .noLocalizadoEn(carnet.getNoLocalizadoEn())
                .despachadoPor(nombre(carnet.getDespachadoPor()))
                .despachadoEn(carnet.getDespachadoEn())
                .recibidoPor(nombre(carnet.getRecibidoPor()))
                .recibidoEn(carnet.getRecibidoEn())
                .devueltoPor(nombre(carnet.getDevueltoPor()))
                .devueltoEn(carnet.getDevueltoEn())
                .recibidoArchivoPor(nombre(carnet.getRecibidoArchivoPor()))
                .recibidoArchivoEn(carnet.getRecibidoArchivoEn())
                .movimientos(movimientos)
                .build();
    }

    private String nombre(UsuarioReferencia usuario) {
        return (usuario != null) ? usuario.getNombreMostrar() : null;
    }
}
