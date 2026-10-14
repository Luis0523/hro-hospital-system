package com.hro.system.parametro.service;

import com.hro.system.parametro.entity.ParametroSistema;
import com.hro.system.parametro.repository.ParametroSistemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Lectura/escritura de parámetros configurables (clave/valor). */
@Service
@RequiredArgsConstructor
public class ParametroSistemaService {

    public static final String UMBRAL_ARCHIVO_ACTIVO = "archivo.umbral_activo";

    /**
     * Caché en memoria con TTL para amortiguar lecturas repetidas de parámetros que
     * se consultan en rutas calientes (p. ej. el umbral en cada listado de carnets).
     * Se invalida al guardar, así que dentro del mismo nodo siempre se lee el valor
     * recién escrito.
     */
    private static final long TTL_MS = 30_000;

    private final ParametroSistemaRepository repository;
    private final Map<String, Entrada> cache = new ConcurrentHashMap<>();

    private record Entrada(String valor, long expiraEn) {
    }

    @Transactional(readOnly = true)
    public String obtener(String clave, String porDefecto) {
        long ahora = System.currentTimeMillis();
        Entrada entrada = cache.get(clave);
        if (entrada != null && entrada.expiraEn() > ahora) {
            return entrada.valor();
        }
        String valor = repository.findById(clave).map(ParametroSistema::getValor).orElse(porDefecto);
        cache.put(clave, new Entrada(valor, ahora + TTL_MS));
        return valor;
    }

    @Transactional
    public String guardar(String clave, String valor) {
        ParametroSistema parametro = repository.findById(clave)
                .orElseGet(() -> ParametroSistema.builder().clave(clave).build());
        parametro.setValor(valor);
        parametro.setActualizadoEn(OffsetDateTime.now());
        String guardado = repository.save(parametro).getValor();
        cache.put(clave, new Entrada(guardado, System.currentTimeMillis() + TTL_MS));
        return guardado;
    }
}
