package com.hro.system.usuario.entity;

import com.hro.system.common.BusinessException;

import java.util.Arrays;
import java.util.List;

/**
 * Tipos de permiso válidos sobre una subespecialidad. Deben coincidir con el
 * CHECK de {@code permiso_subespecialidad.tipo_permiso} (ver migración V1).
 */
public enum TipoPermiso {

    AVANZAR_TURNO("avanzar_turno"),
    GENERAR_ORDEN_LABORATORIO("generar_orden_laboratorio"),
    AUTORIZAR_CUPO("autorizar_cupo");

    private final String valor;

    TipoPermiso(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    public static TipoPermiso from(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessException("El tipo de permiso es obligatorio.");
        }
        String normalizado = valor.trim().toLowerCase();
        return Arrays.stream(values())
                .filter(tipo -> tipo.valor.equals(normalizado))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "Tipo de permiso no válido: '" + valor + "'. Valores permitidos: " + valoresPermitidos() + "."));
    }

    public static List<String> valoresPermitidos() {
        return Arrays.stream(values()).map(TipoPermiso::getValor).toList();
    }
}
