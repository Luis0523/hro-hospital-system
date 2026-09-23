package com.hro.system.usuario.entity;

import com.hro.system.common.BusinessException;

import java.util.Arrays;
import java.util.List;

/**
 * Roles operativos válidos del sistema. Deben coincidir con el CHECK de
 * {@code usuario_referencia.rol_principal} (ver migración V4).
 */
public enum RolSistema {

    PERSONAL_CITAS("personal_citas"),
    ENFERMERIA("enfermeria"),
    MEDICO("medico"),
    ADMINISTRADOR("administrador"),
    ARCHIVO("archivo"),
    JEFE_ENFERMERIA("jefe_enfermeria");

    private final String valor;

    RolSistema(String valor) {
        this.valor = valor;
    }

    public String getValor() {
        return valor;
    }

    public static RolSistema from(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessException("El rol es obligatorio.");
        }
        String normalizado = valor.trim().toLowerCase();
        return Arrays.stream(values())
                .filter(rol -> rol.valor.equals(normalizado))
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "Rol no válido: '" + valor + "'. Roles permitidos: " + valoresPermitidos() + "."));
    }

    public static List<String> valoresPermitidos() {
        return Arrays.stream(values()).map(RolSistema::getValor).toList();
    }
}
