package com.hro.system.common;

/**
 * Conflicto de estado/unicidad (HTTP 409): por ejemplo, un recurso ya existe
 * o una operación no puede aplicarse en el estado actual.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
