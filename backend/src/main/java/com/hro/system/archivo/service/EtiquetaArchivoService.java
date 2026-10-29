package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.ActualizarEtiquetaArchivoRequestDTO;
import com.hro.system.archivo.dto.CrearEtiquetaArchivoRequestDTO;
import com.hro.system.archivo.dto.EtiquetaArchivoResponseDTO;
import com.hro.system.archivo.dto.EtiquetaAsignadaResponseDTO;
import com.hro.system.archivo.entity.EtiquetaArchivo;
import com.hro.system.archivo.entity.EstacionEtiquetaArchivo;
import com.hro.system.archivo.repository.EtiquetaArchivoRepository;
import com.hro.system.archivo.repository.EstacionEtiquetaArchivoRepository;
import com.hro.system.common.BusinessException;
import com.hro.system.common.ConflictException;
import com.hro.system.common.EstadoFiltro;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Catálogo de etiquetas operativas de Archivo y su asignación por estación.
 * Las operaciones de "baja" son lógicas: nunca se eliminan filas.
 */
@Service
@RequiredArgsConstructor
public class EtiquetaArchivoService {

    /** Código de la etiqueta histórica "Clínica de la Mujer". */
    public static final String CODIGO_CLINICA_MUJER = "clinica_mujer";

    private static final Set<String> COLORES_VALIDOS = Set.of(
            "primary", "rose", "blue", "amber", "emerald", "violet", "teal", "slate");

    private final EtiquetaArchivoRepository etiquetaRepository;
    private final EstacionEtiquetaArchivoRepository asignacionRepository;
    private final EstacionEnfermeriaRepository estacionRepository;

    // ------------------------------------------------------------------
    // Catálogo
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<EtiquetaArchivoResponseDTO> listarCatalogo(String estado) {
        Boolean activo = EstadoFiltro.from(estado).aActivo();
        List<EtiquetaArchivo> lista = (activo == null)
                ? etiquetaRepository.findAllByOrderByOrdenAscIdAsc()
                : etiquetaRepository.findByActivoOrderByOrdenAscIdAsc(activo);
        return lista.stream().map(EtiquetaArchivoService::mapCatalogo).toList();
    }

    @Transactional(readOnly = true)
    public EtiquetaArchivoResponseDTO buscar(Long id) {
        return mapCatalogo(etiqueta(id));
    }

    @Transactional
    public EtiquetaArchivoResponseDTO crear(CrearEtiquetaArchivoRequestDTO dto) {
        String codigo = normalizarCodigo(dto.getCodigo());
        if (etiquetaRepository.existsByCodigo(codigo)) {
            throw new ConflictException("ETIQUETA_DUPLICADA",
                    "Ya existe una etiqueta con el código '" + codigo + "'.");
        }
        EtiquetaArchivo etiqueta = EtiquetaArchivo.builder()
                .codigo(codigo)
                .nombre(dto.getNombre().trim())
                .descripcion(limpiar(dto.getDescripcion()))
                .icono(icono(dto.getIcono()))
                .color(color(dto.getColor()))
                .orden(dto.getOrden() != null ? dto.getOrden() : 0)
                .activo(dto.getActivo() != null ? dto.getActivo() : Boolean.TRUE)
                .build();
        return mapCatalogo(etiquetaRepository.save(etiqueta));
    }

    @Transactional
    public EtiquetaArchivoResponseDTO actualizar(Long id, ActualizarEtiquetaArchivoRequestDTO dto) {
        EtiquetaArchivo etiqueta = etiqueta(id);
        String codigo = normalizarCodigo(dto.getCodigo());
        if (etiquetaRepository.existsByCodigoAndIdNot(codigo, id)) {
            throw new ConflictException("ETIQUETA_DUPLICADA",
                    "Ya existe una etiqueta con el código '" + codigo + "'.");
        }
        etiqueta.setCodigo(codigo);
        etiqueta.setNombre(dto.getNombre().trim());
        etiqueta.setDescripcion(limpiar(dto.getDescripcion()));
        etiqueta.setIcono(icono(dto.getIcono()));
        etiqueta.setColor(color(dto.getColor()));
        if (dto.getOrden() != null) {
            etiqueta.setOrden(dto.getOrden());
        }
        if (dto.getActivo() != null) {
            etiqueta.setActivo(dto.getActivo());
        }
        return mapCatalogo(etiquetaRepository.save(etiqueta));
    }

    /** Baja lógica: la etiqueta deja de estar disponible para nuevas salidas. */
    @Transactional
    public EtiquetaArchivoResponseDTO desactivar(Long id) {
        EtiquetaArchivo etiqueta = etiqueta(id);
        etiqueta.setActivo(Boolean.FALSE);
        return mapCatalogo(etiquetaRepository.save(etiqueta));
    }

    @Transactional
    public EtiquetaArchivoResponseDTO reactivar(Long id) {
        EtiquetaArchivo etiqueta = etiqueta(id);
        etiqueta.setActivo(Boolean.TRUE);
        return mapCatalogo(etiquetaRepository.save(etiqueta));
    }

    // ------------------------------------------------------------------
    // Asignación por estación
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<EtiquetaAsignadaResponseDTO> listarAsignadas(Long estacionId) {
        EstacionEnfermeria estacion = estacion(estacionId);
        return asignacionRepository.listarActivasPorEstacion(estacion.getId()).stream()
                .map(EtiquetaArchivoService::mapAsignada)
                .toList();
    }

    /**
     * Reemplaza las etiquetas activas de la estación en el orden recibido.
     * Las etiquetas que dejan de estar en la lista se marcan {@code activo = false};
     * no se elimina ninguna fila.
     */
    @Transactional
    public List<EtiquetaAsignadaResponseDTO> reemplazarAsignacion(Long estacionId, List<Long> etiquetaIds) {
        EstacionEnfermeria estacion = estacion(estacionId);
        List<Long> ids = (etiquetaIds == null) ? List.of()
                : etiquetaIds.stream().filter(Objects::nonNull).distinct().toList();

        Map<Long, EtiquetaArchivo> validas = new LinkedHashMap<>();
        for (Long id : ids) {
            EtiquetaArchivo etiqueta = etiquetaRepository.findById(id)
                    .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                    .orElseThrow(() -> new ResourceNotFoundException("EtiquetaArchivo", "id", id));
            validas.put(id, etiqueta);
        }

        List<EstacionEtiquetaArchivo> existentes =
                asignacionRepository.findByEstacionIdOrderByOrdenAscIdAsc(estacion.getId());
        Map<Long, EstacionEtiquetaArchivo> porEtiqueta = new LinkedHashMap<>();
        for (EstacionEtiquetaArchivo fila : existentes) {
            porEtiqueta.put(fila.getEtiqueta().getId(), fila);
        }

        List<EstacionEtiquetaArchivo> aGuardar = new ArrayList<>();
        int orden = 1;
        for (Map.Entry<Long, EtiquetaArchivo> entrada : validas.entrySet()) {
            EstacionEtiquetaArchivo fila = porEtiqueta.get(entrada.getKey());
            if (fila == null) {
                fila = EstacionEtiquetaArchivo.builder()
                        .estacion(estacion)
                        .etiqueta(entrada.getValue())
                        .activo(Boolean.TRUE)
                        .build();
            }
            fila.setActivo(Boolean.TRUE);
            fila.setOrden(orden++);
            aGuardar.add(fila);
        }
        for (EstacionEtiquetaArchivo fila : existentes) {
            if (!validas.containsKey(fila.getEtiqueta().getId())) {
                fila.setActivo(Boolean.FALSE);
                aGuardar.add(fila);
            }
        }
        asignacionRepository.saveAll(aGuardar);
        return listarAsignadas(estacion.getId());
    }

    // ------------------------------------------------------------------
    // Resolución para el registro de salidas
    // ------------------------------------------------------------------

    /**
     * Etiqueta elegida por el operador: debe existir, estar activa y estar
     * habilitada en la estación de la salida.
     */
    @Transactional(readOnly = true)
    public EtiquetaArchivo resolverParaSalida(Long estacionId, Long etiquetaId) {
        if (etiquetaId == null) {
            return null;
        }
        EtiquetaArchivo etiqueta = etiquetaRepository.findById(etiquetaId)
                .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                .orElseThrow(() -> new BusinessException("ETIQUETA_NO_DISPONIBLE",
                        "La etiqueta seleccionada no existe o está inactiva."));
        if (estacionId != null
                && asignacionRepository.countByEstacionIdAndEtiquetaIdAndActivoTrue(estacionId, etiquetaId) == 0) {
            throw new BusinessException("ETIQUETA_NO_ASIGNADA",
                    "La etiqueta seleccionada no está habilitada para esta estación.");
        }
        return etiqueta;
    }

    /** Compatibilidad con clientes que aún envían solo {@code esClinicaMujer}. */
    @Transactional(readOnly = true)
    public EtiquetaArchivo resolverClinicaMujer() {
        return etiquetaRepository.findByCodigo(CODIGO_CLINICA_MUJER).orElse(null);
    }

    // ------------------------------------------------------------------
    // Utilidades
    // ------------------------------------------------------------------

    private EtiquetaArchivo etiqueta(Long id) {
        return etiquetaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EtiquetaArchivo", "id", id));
    }

    private EstacionEnfermeria estacion(Long estacionId) {
        return estacionRepository.findById(estacionId)
                .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("EstacionEnfermeria", "id", estacionId));
    }

    private static EtiquetaArchivoResponseDTO mapCatalogo(EtiquetaArchivo e) {
        return new EtiquetaArchivoResponseDTO(
                e.getId(),
                e.getCodigo(),
                e.getNombre(),
                e.getDescripcion(),
                e.getIcono(),
                e.getColor(),
                e.getOrden(),
                e.getActivo(),
                e.getCreadoEn());
    }

    private static EtiquetaAsignadaResponseDTO mapAsignada(EstacionEtiquetaArchivo fila) {
        EtiquetaArchivo e = fila.getEtiqueta();
        return new EtiquetaAsignadaResponseDTO(
                e.getId(),
                e.getCodigo(),
                e.getNombre(),
                e.getDescripcion(),
                e.getIcono(),
                e.getColor(),
                fila.getOrden());
    }

    /** Normaliza el código a minúsculas, sin acentos y con guiones bajos. */
    static String normalizarCodigo(String valor) {
        String base = limpiar(valor);
        if (base == null) {
            throw new BusinessException("El código es obligatorio.");
        }
        String sinAcentos = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String codigo = sinAcentos.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (codigo.isEmpty()) {
            throw new BusinessException("El código debe contener letras o números.");
        }
        return codigo.length() > 40 ? codigo.substring(0, 40) : codigo;
    }

    private static String limpiar(String valor) {
        if (valor == null) {
            return null;
        }
        String texto = valor.trim();
        return texto.isEmpty() ? null : texto;
    }

    private static String icono(String valor) {
        String icono = limpiar(valor);
        return icono != null ? icono : "label";
    }

    private static String color(String valor) {
        String color = limpiar(valor);
        if (color == null) {
            return "primary";
        }
        String clave = color.toLowerCase(Locale.ROOT);
        return COLORES_VALIDOS.contains(clave) ? clave : "primary";
    }
}
