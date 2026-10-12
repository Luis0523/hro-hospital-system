package com.hro.system.parametro.service;

import com.hro.system.parametro.entity.ParametroSistema;
import com.hro.system.parametro.repository.ParametroSistemaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/** Lectura/escritura de parámetros configurables (clave/valor). */
@Service
@RequiredArgsConstructor
public class ParametroSistemaService {

    public static final String UMBRAL_ARCHIVO_ACTIVO = "archivo.umbral_activo";

    private final ParametroSistemaRepository repository;

    @Transactional(readOnly = true)
    public String obtener(String clave, String porDefecto) {
        return repository.findById(clave).map(ParametroSistema::getValor).orElse(porDefecto);
    }

    @Transactional
    public String guardar(String clave, String valor) {
        ParametroSistema parametro = repository.findById(clave)
                .orElseGet(() -> ParametroSistema.builder().clave(clave).build());
        parametro.setValor(valor);
        parametro.setActualizadoEn(OffsetDateTime.now());
        return repository.save(parametro).getValor();
    }
}
