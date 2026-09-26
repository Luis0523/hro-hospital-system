package com.hro.system.common;

/**
 * Filtro de estado para listados administrativos de catálogos.
 * Valores de entrada aceptados: {@code activos} (por defecto), {@code inactivos}, {@code todos}.
 */
public enum EstadoFiltro {

    ACTIVOS,
    INACTIVOS,
    TODOS;

    public static EstadoFiltro from(String valor) {
        if (valor == null || valor.isBlank()) {
            return ACTIVOS;
        }
        return switch (valor.trim().toLowerCase()) {
            case "activos" -> ACTIVOS;
            case "inactivos" -> INACTIVOS;
            case "todos" -> TODOS;
            default -> throw new BusinessException(
                    "Valor de estado no válido: '" + valor + "'. Valores permitidos: activos, inactivos, todos.");
        };
    }

    /**
     * @return {@code true} activos, {@code false} inactivos, {@code null} sin filtro (todos).
     */
    public Boolean aActivo() {
        return switch (this) {
            case ACTIVOS -> Boolean.TRUE;
            case INACTIVOS -> Boolean.FALSE;
            case TODOS -> null;
        };
    }
}
