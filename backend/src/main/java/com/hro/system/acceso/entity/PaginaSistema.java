package com.hro.system.acceso.entity;

import java.util.Arrays;
import java.util.List;

/**
 * Catálogo de páginas/áreas del SIGHO que pueden asignarse a un rol.
 * El {@code clave} coincide con el segmento de ruta que usa el frontend.
 */
public enum PaginaSistema {

    ARCHIVO("archivo", "Estación de Archivo"),
    REGISTRO_CARNETS("registro_carnets", "Registro de carnets"),
    ENFERMERIA("enfermeria", "Estación de Enfermería"),
    COEX("coex", "Mesa COEX"),
    LIBRO_CITAS("libro_citas", "Libro de Citas"),
    ADMINISTRACION("administracion", "Panel de Administración"),
    JEFE_ENFERMERIA("jefe_enfermeria", "Área Jefe de Enfermería");

    private final String clave;
    private final String nombre;

    PaginaSistema(String clave, String nombre) {
        this.clave = clave;
        this.nombre = nombre;
    }

    public String getClave() {
        return clave;
    }

    public String getNombre() {
        return nombre;
    }

    public static boolean esClaveValida(String clave) {
        return Arrays.stream(values()).anyMatch(pagina -> pagina.clave.equals(clave));
    }

    public static List<PaginaSistema> catalogo() {
        return List.of(values());
    }
}
