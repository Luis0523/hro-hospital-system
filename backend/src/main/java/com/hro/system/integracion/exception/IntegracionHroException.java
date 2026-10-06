package com.hro.system.integracion.exception;

/**
 * Error al consultar el API externo del hospital (timeout, 5xx, respuesta inválida).
 * Se traduce a HTTP 502 (Bad Gateway).
 */
public class IntegracionHroException extends RuntimeException {
    public IntegracionHroException(String message) {
        super(message);
    }
}
