package com.hro.system.common;

public class BusinessException extends RuntimeException {

    private final String codigo;

    public BusinessException(String message) {
        super(message);
        this.codigo = null;
    }

    public BusinessException(String codigo, String message) {
        super(message);
        this.codigo = codigo;
    }

    public String getCodigo() {
        return codigo;
    }
}
