package com.hro.system.common;

/**
 * Conflicto de estado/unicidad (HTTP 409): por ejemplo, un recurso ya existe
 * o una operación no puede aplicarse en el estado actual.
 * <p>
 * Puede transportar un {@code codigo} estable y un {@code data} estructurado
 * (por ejemplo, las citas afectadas al bloquear un día no laborable) para que
 * el frontend pueda decidir cómo continuar.
 */
public class ConflictException extends RuntimeException {

    private final String codigo;
    private final transient Object data;

    public ConflictException(String message) {
        this(null, message, null);
    }

    public ConflictException(String codigo, String message) {
        this(codigo, message, null);
    }

    public ConflictException(String codigo, String message, Object data) {
        super(message);
        this.codigo = codigo;
        this.data = data;
    }

    public String getCodigo() {
        return codigo;
    }

    public Object getData() {
        return data;
    }
}
