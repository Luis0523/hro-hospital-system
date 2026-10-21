package com.hro.system.turnoestacion.entity;

import java.util.EnumSet;
import java.util.Set;

public enum EstadoTurnoEstacion {

    registrado,
    recibido,
    en_clinica,
    llamado,
    no_asistio,
    atendido,
    devuelto,
    archivado;

    public boolean puedeTransicionarA(EstadoTurnoEstacion destino) {
        return destinosPermitidos().contains(destino);
    }

    private Set<EstadoTurnoEstacion> destinosPermitidos() {
        return switch (this) {
            case registrado -> EnumSet.of(recibido);
            case recibido -> EnumSet.of(en_clinica);
            case en_clinica -> EnumSet.of(llamado, no_asistio, atendido, devuelto);
            case llamado -> EnumSet.of(llamado, no_asistio, atendido, devuelto);
            case no_asistio -> EnumSet.of(llamado, devuelto);
            case atendido -> EnumSet.of(devuelto);
            case devuelto -> EnumSet.of(archivado);
            case archivado -> EnumSet.noneOf(EstadoTurnoEstacion.class);
        };
    }
}
