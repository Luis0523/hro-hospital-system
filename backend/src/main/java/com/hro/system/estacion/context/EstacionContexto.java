package com.hro.system.estacion.context;

import java.util.Optional;

/**
 * Estación de enfermería activa en la petición actual.
 * <p>
 * La estación es de la <b>sesión</b> (rotación de personal), no del usuario: el frontend la envía
 * en el header {@code X-Estacion-Id} y aquí queda disponible durante el despacho al controlador.
 * Se limpia al finalizar el filtro.
 */
public final class EstacionContexto {

    private EstacionContexto() {
    }

    /** Referencia ligera de la estación: el id numérico o, si vino por código, el código. */
    public record EstacionRef(Long id, String codigo) {
    }

    private static final ThreadLocal<EstacionRef> ACTUAL = new ThreadLocal<>();

    public static void establecer(Long id, String codigo) {
        ACTUAL.set(new EstacionRef(id, codigo));
    }

    public static Optional<EstacionRef> actual() {
        return Optional.ofNullable(ACTUAL.get());
    }

    public static Optional<Long> idActual() {
        return actual().map(EstacionRef::id);
    }

    public static void limpiar() {
        ACTUAL.remove();
    }
}
