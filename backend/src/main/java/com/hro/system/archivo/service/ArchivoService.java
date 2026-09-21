package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.*;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.entity.ExpedienteMovimiento;
import com.hro.system.archivo.entity.UbicacionArchivo;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteMovimientoRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.archivo.repository.UbicacionArchivoRepository;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Lógica del ciclo de vida físico del expediente (búsqueda, entrega a la clínica y retorno),
 * modelada como un ciclo por cita con una bitácora de movimientos tipo rastreo de paquetería.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArchivoService {

    public static final String PENDIENTE_LOCALIZAR = "pendiente_localizar";
    public static final String EN_BUSQUEDA = "en_busqueda";
    public static final String LOCALIZADO = "localizado";
    public static final String EN_TRANSITO_ENTREGA = "en_transito_entrega";
    public static final String ENTREGADO = "entregado";
    public static final String EN_TRANSITO_RETORNO = "en_transito_retorno";
    public static final String ARCHIVADO = "archivado";
    public static final String NO_LOCALIZADO = "no_localizado";

    private static final String ACCION_INICIAR_BUSQUEDA = "iniciar-busqueda";
    private static final String ACCION_LOCALIZAR = "localizar";
    private static final String ACCION_DESPACHAR = "despachar";
    private static final String ACCION_ENTREGAR = "entregar";
    private static final String ACCION_RETORNAR = "retornar";
    private static final String ACCION_ARCHIVAR = "archivar";
    private static final String ACCION_NO_LOCALIZADO = "no-localizado";
    private static final String ACCION_REINTENTAR_BUSQUEDA = "reintentar-busqueda";

    private static final Map<String, String> ESTADO_ORIGEN = Map.of(
            ACCION_INICIAR_BUSQUEDA, PENDIENTE_LOCALIZAR,
            ACCION_LOCALIZAR, EN_BUSQUEDA,
            ACCION_DESPACHAR, LOCALIZADO,
            ACCION_ENTREGAR, EN_TRANSITO_ENTREGA,
            ACCION_RETORNAR, ENTREGADO,
            ACCION_ARCHIVAR, EN_TRANSITO_RETORNO,
            ACCION_REINTENTAR_BUSQUEDA, NO_LOCALIZADO);

    private static final Map<String, String> ESTADO_DESTINO = Map.of(
            ACCION_INICIAR_BUSQUEDA, EN_BUSQUEDA,
            ACCION_LOCALIZAR, LOCALIZADO,
            ACCION_DESPACHAR, EN_TRANSITO_ENTREGA,
            ACCION_ENTREGAR, ENTREGADO,
            ACCION_RETORNAR, EN_TRANSITO_RETORNO,
            ACCION_ARCHIVAR, ARCHIVADO,
            ACCION_REINTENTAR_BUSQUEDA, EN_BUSQUEDA);

    private final UbicacionArchivoRepository ubicacionArchivoRepository;
    private final ExpedienteRepository expedienteRepository;
    private final ExpedienteCicloRepository expedienteCicloRepository;
    private final ExpedienteMovimientoRepository expedienteMovimientoRepository;
    private final PacienteRepository pacienteRepository;
    private final CitaRepository citaRepository;
    private final UsuarioReferenciaRepository usuarioReferenciaRepository;

    // ------------------------------------------------------------------
    // Catálogo de ubicaciones
    // ------------------------------------------------------------------

    @Transactional
    public UbicacionArchivoResponseDTO crearUbicacion(CrearUbicacionArchivoRequestDTO dto) {
        ubicacionArchivoRepository.findByPasilloAndEstanteAndBalda(dto.getPasillo(), dto.getEstante(), dto.getBalda())
                .ifPresent(u -> {
                    throw new ConflictException("Ya existe una ubicación con pasillo '" + dto.getPasillo()
                            + "', estante '" + dto.getEstante() + "' y balda '" + dto.getBalda() + "'");
                });

        UbicacionArchivo ubicacion = ubicacionArchivoRepository.save(UbicacionArchivo.builder()
                .pasillo(dto.getPasillo())
                .estante(dto.getEstante())
                .balda(dto.getBalda())
                .descripcion(dto.getDescripcion())
                .build());

        return mapUbicacion(ubicacion);
    }

    @Transactional(readOnly = true)
    public List<UbicacionArchivoResponseDTO> listarUbicaciones() {
        return ubicacionArchivoRepository.findAll().stream()
                .map(this::mapUbicacion)
                .toList();
    }

    // ------------------------------------------------------------------
    // Expedientes
    // ------------------------------------------------------------------

    @Transactional
    public ExpedienteResponseDTO crearExpediente(CrearExpedienteRequestDTO dto) {
        Paciente paciente = pacienteRepository.findById(dto.getPacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", "id", dto.getPacienteId()));

        if (expedienteRepository.findByPacienteId(dto.getPacienteId()).isPresent()) {
            throw new ConflictException("El paciente ya tiene un expediente físico registrado");
        }

        String numero = (dto.getNumeroExpediente() != null && !dto.getNumeroExpediente().isBlank())
                ? dto.getNumeroExpediente().trim()
                : paciente.getNumeroExpediente();

        if (numero == null || numero.isBlank()) {
            throw new BusinessException("Debe indicar un número de expediente: el paciente no tiene uno asignado");
        }

        if (expedienteRepository.findByNumeroExpediente(numero).isPresent()) {
            throw new ConflictException("Ya existe un expediente con el número '" + numero + "'");
        }

        UbicacionArchivo ubicacionBase = null;
        if (dto.getUbicacionBaseId() != null) {
            ubicacionBase = ubicacionArchivoRepository.findById(dto.getUbicacionBaseId())
                    .orElseThrow(() -> new ResourceNotFoundException("UbicacionArchivo", "id", dto.getUbicacionBaseId()));
        }

        Expediente expediente = expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente(numero)
                .ubicacionBase(ubicacionBase)
                .activo(true)
                .creadoEn(OffsetDateTime.now())
                .build());

        log.info("Expediente físico {} creado para paciente {}", expediente.getId(), paciente.getId());
        return mapExpediente(expediente);
    }

    @Transactional(readOnly = true)
    public ExpedienteResponseDTO obtenerExpediente(UUID id) {
        return mapExpediente(buscarExpediente(id));
    }

    @Transactional(readOnly = true)
    public ExpedienteResponseDTO obtenerExpedientePorNumero(String numeroExpediente) {
        Expediente expediente = expedienteRepository.findByNumeroExpediente(numeroExpediente)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", "numeroExpediente", numeroExpediente));
        return mapExpediente(expediente);
    }

    @Transactional(readOnly = true)
    public ExpedienteResponseDTO obtenerExpedientePorPaciente(UUID pacienteId) {
        Expediente expediente = expedienteRepository.findByPacienteId(pacienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", "pacienteId", pacienteId));
        return mapExpediente(expediente);
    }

    @Transactional(readOnly = true)
    public Page<ExpedienteResponseDTO> buscarExpedientes(String filtro, Pageable pageable) {
        return expedienteRepository.buscar(filtro, pageable).map(this::mapExpediente);
    }

    @Transactional
    public ExpedienteResponseDTO reubicarExpediente(UUID id, ReubicarExpedienteRequestDTO dto) {
        Expediente expediente = buscarExpediente(id);
        UbicacionArchivo nuevaBase = ubicacionArchivoRepository.findById(dto.getUbicacionBaseId())
                .orElseThrow(() -> new ResourceNotFoundException("UbicacionArchivo", "id", dto.getUbicacionBaseId()));

        expediente.setUbicacionBase(nuevaBase);
        return mapExpediente(expedienteRepository.save(expediente));
    }

    // ------------------------------------------------------------------
    // Ciclos
    // ------------------------------------------------------------------

    @Transactional
    public ExpedienteCicloResponseDTO iniciarCiclo(IniciarCicloRequestDTO dto) {
        Expediente expediente = buscarExpediente(dto.getExpedienteId());
        Cita cita = citaRepository.findById(dto.getCitaId())
                .orElseThrow(() -> new ResourceNotFoundException("Cita", "id", dto.getCitaId()));

        if (expedienteCicloRepository.existsByCitaId(dto.getCitaId())) {
            throw new ConflictException("La cita #" + dto.getCitaId() + " ya tiene un ciclo de expediente asociado");
        }

        UsuarioReferencia usuario = usuarioActual();

        ExpedienteCiclo ciclo = expedienteCicloRepository.save(ExpedienteCiclo.builder()
                .expediente(expediente)
                .cita(cita)
                .estadoActual(PENDIENTE_LOCALIZAR)
                .version(0)
                .creadoEn(OffsetDateTime.now())
                .actualizadoEn(OffsetDateTime.now())
                .build());

        registrarMovimiento(ciclo, null, PENDIENTE_LOCALIZAR, null, null, usuario,
                "Ciclo de expediente creado para la cita #" + cita.getId());

        log.info("Ciclo de expediente {} iniciado para cita {}", ciclo.getId(), cita.getId());
        return mapCiclo(ciclo);
    }

    @Transactional(readOnly = true)
    public ExpedienteCicloResponseDTO obtenerCiclo(UUID id) {
        return mapCiclo(buscarCiclo(id));
    }

    @Transactional(readOnly = true)
    public ExpedienteCicloResponseDTO obtenerCicloPorCita(Long citaId) {
        ExpedienteCiclo ciclo = expedienteCicloRepository.findByCitaId(citaId)
                .orElseThrow(() -> new ResourceNotFoundException("ExpedienteCiclo", "citaId", citaId));
        return mapCiclo(ciclo);
    }

    @Transactional(readOnly = true)
    public List<ExpedienteCicloResponseDTO> listarCiclosPorExpediente(UUID expedienteId) {
        buscarExpediente(expedienteId);
        return expedienteCicloRepository.findByExpedienteIdOrderByCreadoEnDesc(expedienteId).stream()
                .map(this::mapCiclo)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExpedienteCicloResponseDTO> listarCola(String estado, LocalDate fecha) {
        String estadoNormalizado = (estado != null && !estado.isBlank()) ? estado.trim() : null;
        return expedienteCicloRepository.buscarCola(estadoNormalizado, fecha).stream()
                .map(this::mapCiclo)
                .toList();
    }

    // ------------------------------------------------------------------
    // Transiciones del ciclo
    // ------------------------------------------------------------------

    @Transactional
    public ExpedienteCicloResponseDTO iniciarBusqueda(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_INICIAR_BUSQUEDA, dto);
    }

    @Transactional
    public ExpedienteCicloResponseDTO localizar(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_LOCALIZAR, dto);
    }

    @Transactional
    public ExpedienteCicloResponseDTO despachar(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_DESPACHAR, dto);
    }

    @Transactional
    public ExpedienteCicloResponseDTO entregar(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_ENTREGAR, dto);
    }

    @Transactional
    public ExpedienteCicloResponseDTO retornar(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_RETORNAR, dto);
    }

    @Transactional
    public ExpedienteCicloResponseDTO archivar(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_ARCHIVAR, dto);
    }

    @Transactional
    public ExpedienteCicloResponseDTO marcarNoLocalizado(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_NO_LOCALIZADO, dto);
    }

    @Transactional
    public ExpedienteCicloResponseDTO reintentarBusqueda(UUID cicloId, TransicionCicloRequestDTO dto) {
        return transicionar(cicloId, ACCION_REINTENTAR_BUSQUEDA, dto);
    }

    private ExpedienteCicloResponseDTO transicionar(UUID cicloId, String accion, TransicionCicloRequestDTO dto) {
        ExpedienteCiclo ciclo = buscarCiclo(cicloId);
        UsuarioReferencia usuario = usuarioActual();

        String estadoAnterior = ciclo.getEstadoActual();
        String nuevoEstado;
        UbicacionArchivo origen = null;
        UbicacionArchivo destino = null;

        if (ACCION_NO_LOCALIZADO.equals(accion)) {
            if (ARCHIVADO.equals(estadoAnterior) || NO_LOCALIZADO.equals(estadoAnterior)) {
                throw new BusinessException("No se puede marcar como 'no_localizado' un ciclo en estado '" + estadoAnterior + "'");
            }
            if (dto == null || dto.getObservacion() == null || dto.getObservacion().isBlank()) {
                throw new BusinessException("Debe indicar una observación al marcar el expediente como 'no_localizado'");
            }
            nuevoEstado = NO_LOCALIZADO;
        } else {
            String origenEsperado = ESTADO_ORIGEN.get(accion);
            if (!origenEsperado.equals(estadoAnterior)) {
                throw new BusinessException(String.format(
                        "Transición inválida: no se puede ejecutar '%s' desde el estado '%s' (se esperaba '%s')",
                        accion, estadoAnterior, origenEsperado));
            }
            nuevoEstado = ESTADO_DESTINO.get(accion);

            if (dto != null && dto.getUbicacionDestinoId() != null) {
                destino = ubicacionArchivoRepository.findById(dto.getUbicacionDestinoId())
                        .orElseThrow(() -> new ResourceNotFoundException("UbicacionArchivo", "id", dto.getUbicacionDestinoId()));
            }

            if (ACCION_DESPACHAR.equals(accion)) {
                origen = ciclo.getExpediente().getUbicacionBase();
            }

            if (ACCION_ARCHIVAR.equals(accion) && destino == null) {
                destino = ciclo.getExpediente().getUbicacionBase();
                if (destino == null) {
                    throw new BusinessException("Debe indicar una ubicación destino para archivar: el expediente no tiene ubicación base");
                }
            }
        }

        ciclo.setEstadoActual(nuevoEstado);
        ciclo.setActualizadoEn(OffsetDateTime.now());
        ExpedienteCiclo actualizado = expedienteCicloRepository.saveAndFlush(ciclo);

        registrarMovimiento(actualizado, estadoAnterior, nuevoEstado, origen, destino, usuario,
                dto != null ? dto.getObservacion() : null);

        log.info("Ciclo {} transicionó '{}' -> '{}' por acción '{}'", cicloId, estadoAnterior, nuevoEstado, accion);
        return mapCiclo(actualizado);
    }

    // ------------------------------------------------------------------
    // Apoyo
    // ------------------------------------------------------------------

    private Expediente buscarExpediente(UUID id) {
        return expedienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", "id", id));
    }

    private ExpedienteCiclo buscarCiclo(UUID id) {
        return expedienteCicloRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ExpedienteCiclo", "id", id));
    }

    private UsuarioReferencia usuarioActual() {
        Long usuarioId = UsuarioContexto.idActual();
        return usuarioReferenciaRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", usuarioId));
    }

    private void registrarMovimiento(ExpedienteCiclo ciclo, String estadoAnterior, String estadoNuevo,
                                     UbicacionArchivo origen, UbicacionArchivo destino,
                                     UsuarioReferencia usuario, String observacion) {
        expedienteMovimientoRepository.save(ExpedienteMovimiento.builder()
                .expedienteCiclo(ciclo)
                .estadoAnterior(estadoAnterior)
                .estadoNuevo(estadoNuevo)
                .ubicacionOrigen(origen)
                .ubicacionDestino(destino)
                .usuarioReferencia(usuario)
                .observacion(observacion)
                .fechaMovimiento(OffsetDateTime.now())
                .build());
    }

    private UbicacionArchivoResponseDTO mapUbicacion(UbicacionArchivo ubicacion) {
        if (ubicacion == null) {
            return null;
        }
        return UbicacionArchivoResponseDTO.builder()
                .id(ubicacion.getId())
                .pasillo(ubicacion.getPasillo())
                .estante(ubicacion.getEstante())
                .balda(ubicacion.getBalda())
                .descripcion(ubicacion.getDescripcion())
                .build();
    }

    private ExpedienteResponseDTO mapExpediente(Expediente expediente) {
        return ExpedienteResponseDTO.builder()
                .id(expediente.getId())
                .pacienteId(expediente.getPaciente().getId())
                .numeroExpediente(expediente.getNumeroExpediente())
                .ubicacionBase(mapUbicacion(expediente.getUbicacionBase()))
                .activo(expediente.getActivo())
                .creadoEn(expediente.getCreadoEn())
                .build();
    }

    private ExpedienteMovimientoResponseDTO mapMovimiento(ExpedienteMovimiento movimiento) {
        return ExpedienteMovimientoResponseDTO.builder()
                .id(movimiento.getId())
                .estadoAnterior(movimiento.getEstadoAnterior())
                .estadoNuevo(movimiento.getEstadoNuevo())
                .ubicacionOrigen(mapUbicacion(movimiento.getUbicacionOrigen()))
                .ubicacionDestino(mapUbicacion(movimiento.getUbicacionDestino()))
                .usuarioId(movimiento.getUsuarioReferencia().getId())
                .usuarioNombre(movimiento.getUsuarioReferencia().getNombreMostrar())
                .observacion(movimiento.getObservacion())
                .fechaMovimiento(movimiento.getFechaMovimiento())
                .build();
    }

    private ExpedienteCicloResponseDTO mapCiclo(ExpedienteCiclo ciclo) {
        Expediente expediente = ciclo.getExpediente();
        Paciente paciente = expediente.getPaciente();

        List<ExpedienteMovimientoResponseDTO> movimientos = expedienteMovimientoRepository
                .findByExpedienteCicloIdOrderByFechaMovimientoAscIdAsc(ciclo.getId()).stream()
                .map(this::mapMovimiento)
                .toList();

        return ExpedienteCicloResponseDTO.builder()
                .id(ciclo.getId())
                .expedienteId(expediente.getId())
                .numeroExpediente(expediente.getNumeroExpediente())
                .paciente(PacienteResumenDTO.builder()
                        .id(paciente.getId())
                        .nombres(paciente.getNombres())
                        .apellidos(paciente.getApellidos())
                        .dpi(paciente.getDpi())
                        .build())
                .citaId(ciclo.getCita().getId())
                .estadoActual(ciclo.getEstadoActual())
                .version(ciclo.getVersion())
                .creadoEn(ciclo.getCreadoEn())
                .actualizadoEn(ciclo.getActualizadoEn())
                .movimientos(movimientos)
                .build();
    }
}
