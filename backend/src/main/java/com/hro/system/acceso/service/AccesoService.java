package com.hro.system.acceso.service;

import com.hro.system.acceso.dto.PaginaDTO;
import com.hro.system.acceso.dto.RolPaginasDTO;
import com.hro.system.acceso.entity.PaginaSistema;
import com.hro.system.acceso.entity.RolPagina;
import com.hro.system.acceso.repository.RolPaginaRepository;
import com.hro.system.common.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Configuración de páginas/áreas por rol (no administra roles; esos viven en Keycloak).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccesoService {

    private final RolPaginaRepository rolPaginaRepository;

    /** Catálogo de páginas/áreas disponibles. */
    public List<PaginaDTO> catalogo() {
        return PaginaSistema.catalogo().stream()
                .map(pagina -> PaginaDTO.builder().clave(pagina.getClave()).nombre(pagina.getNombre()).build())
                .toList();
    }

    /** Mapeo completo: por cada rol, sus páginas activas. */
    @Transactional(readOnly = true)
    public List<RolPaginasDTO> listar() {
        Map<String, List<String>> porRol = rolPaginaRepository.findByActivoTrueOrderByRolAscPaginaAsc().stream()
                .collect(Collectors.groupingBy(
                        RolPagina::getRol,
                        java.util.TreeMap::new,
                        Collectors.mapping(RolPagina::getPagina, Collectors.toList())));
        return porRol.entrySet().stream()
                .map(entrada -> RolPaginasDTO.builder().rol(entrada.getKey()).paginas(entrada.getValue()).build())
                .toList();
    }

    /** Reemplaza las páginas de un rol. */
    @Transactional
    public RolPaginasDTO asignar(String rol, List<String> paginas) {
        String rolNormalizado = (rol != null) ? rol.trim() : null;
        if (rolNormalizado == null || rolNormalizado.isBlank()) {
            throw new BusinessException("El rol es obligatorio");
        }

        List<String> solicitadas = (paginas != null) ? paginas.stream().filter(p -> p != null).distinct().toList() : List.of();
        List<String> invalidas = solicitadas.stream().filter(p -> !PaginaSistema.esClaveValida(p)).toList();
        if (!invalidas.isEmpty()) {
            throw new BusinessException("Páginas no válidas: " + invalidas);
        }

        // Borrado por entidad + flush: garantiza el DELETE antes del INSERT y
        // respeta UNIQUE(rol, pagina) incluso dentro de una misma transacción.
        List<RolPagina> existentes = rolPaginaRepository.findByRolOrderByPaginaAsc(rolNormalizado);
        if (!existentes.isEmpty()) {
            rolPaginaRepository.deleteAll(existentes);
            rolPaginaRepository.flush();
        }
        if (!solicitadas.isEmpty()) {
            List<RolPagina> nuevas = solicitadas.stream()
                    .map(pagina -> RolPagina.builder()
                            .rol(rolNormalizado)
                            .pagina(pagina)
                            .activo(true)
                            .creadoEn(OffsetDateTime.now())
                            .actualizadoEn(OffsetDateTime.now())
                            .build())
                    .toList();
            rolPaginaRepository.saveAll(nuevas);
        }

        log.info("Páginas del rol '{}' actualizadas: {}", rolNormalizado, solicitadas);
        return RolPaginasDTO.builder().rol(rolNormalizado).paginas(solicitadas).build();
    }
}
