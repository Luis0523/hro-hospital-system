package com.hro.system.reporte;

/** Formato de presentación del número de expediente en documentos PDF. */
public final class FormatoExpediente {

    private FormatoExpediente() {
    }

    /**
     * Inserta un guion antes de los dos últimos dígitos. Los expedientes de
     * cinco dígitos se muestran como 4 + 1 (p. ej. 30954 -> 3095-4).
     */
    public static String formatear(String numero) {
        if (numero == null) {
            return "";
        }
        String texto = numero.trim();
        if (!texto.matches("\\d+")) {
            return texto;
        }
        if (texto.length() == 5) {
            return texto.substring(0, 4) + "-" + texto.substring(4);
        }
        if (texto.length() >= 3) {
            return texto.substring(0, texto.length() - 2) + "-" + texto.substring(texto.length() - 2);
        }
        return texto;
    }
}
