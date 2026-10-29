package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.DashboardJefeArchivoDTO;
import com.hro.system.archivo.entity.EtiquetaArchivo;
import com.hro.system.archivo.entity.RegistroCuadernoRojo;
import com.hro.system.archivo.entity.SalidaArchivoHospital;
import com.hro.system.archivo.repository.RegistroCuadernoRojoRepository;
import com.hro.system.archivo.repository.SalidaArchivoHospitalRepository;
import com.hro.system.carnet.entity.Carnet;
import com.hro.system.carnet.repository.CarnetRepository;
import com.hro.system.parametro.service.ParametroSistemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Estadísticas del dashboard administrativo (Jefe de Archivo). Se alimenta de
 * las salidas registradas en Archivo (Registro Médico), de los estados
 * actuales de los carnets y del Cuaderno Rojo.
 */
@Service
@RequiredArgsConstructor
public class DashboardJefeArchivoService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    private static final List<String> ESTADOS = List.of(
            "registrado",
            "no_localizado",
            "salida_archivo",
            "salida_enfermeria",
            "resguardado");

    private final SalidaArchivoHospitalRepository salidaRepository;
    private final CarnetRepository carnetRepository;
    private final RegistroCuadernoRojoRepository cuadernoRepository;
    private final ParametroSistemaService parametros;

    @Transactional(readOnly = true)
    public DashboardJefeArchivoDTO estadisticas(LocalDate fechaParam) {
        LocalDate fecha = (fechaParam != null) ? fechaParam : LocalDate.now(ZONA_HORARIA);
        Long umbral = umbralActivo();

        List<SalidaArchivoHospital> salidas = salidaRepository.findByFechaOrderByRegistradoEnDesc(fecha);

        long totalClinicaMujer = 0;
        long totalActivos = 0;
        long totalPasivos = 0;
        Map<Long, List<SalidaArchivoHospital>> agrupadas = new LinkedHashMap<>();
        for (SalidaArchivoHospital salida : salidas) {
            Long estacionId = salida.getEstacion() != null ? salida.getEstacion().getId() : null;
            agrupadas.computeIfAbsent(estacionId, k -> new ArrayList<>()).add(salida);

            if (salida.isEsClinicaMujer()) {
                totalClinicaMujer++;
            }
            String clasificacion = clasificar(salida.getNumeroExpediente(), umbral);
            if ("activo".equals(clasificacion)) {
                totalActivos++;
            } else if ("pasivo".equals(clasificacion)) {
                totalPasivos++;
            }
        }

        List<DashboardJefeArchivoDTO.EtiquetaTotal> porEtiqueta = contarEtiquetas(salidas);

        List<DashboardJefeArchivoDTO.EstacionSalidaTotal> porEstacionList = new ArrayList<>();
        for (Map.Entry<Long, List<SalidaArchivoHospital>> entry : agrupadas.entrySet()) {
            List<SalidaArchivoHospital> grupo = entry.getValue();
            String estacionNombre = grupo.stream()
                    .map(SalidaArchivoHospital::getEstacion)
                    .filter(e -> e != null && e.getNombre() != null)
                    .map(e -> e.getNombre())
                    .findFirst()
                    .orElse(null);
            long clinicaMujer = grupo.stream().filter(SalidaArchivoHospital::isEsClinicaMujer).count();
            long activos = grupo.stream()
                    .filter(s -> "activo".equals(clasificar(s.getNumeroExpediente(), umbral)))
                    .count();
            long pasivos = grupo.stream()
                    .filter(s -> "pasivo".equals(clasificar(s.getNumeroExpediente(), umbral)))
                    .count();
            porEstacionList.add(new DashboardJefeArchivoDTO.EstacionSalidaTotal(
                    entry.getKey(),
                    estacionNombre,
                    grupo.size(),
                    clinicaMujer,
                    activos,
                    pasivos,
                    contarEtiquetas(grupo)));
        }
        porEstacionList.sort(Comparator.comparingLong(
                DashboardJefeArchivoDTO.EstacionSalidaTotal::total).reversed());

        Map<String, Long> estados = new LinkedHashMap<>();
        for (String estado : ESTADOS) {
            estados.put(estado, 0L);
        }
        for (Carnet carnet : carnetRepository.listarPorFecha(fecha)) {
            if (estados.containsKey(carnet.getEstado())) {
                estados.merge(carnet.getEstado(), 1L, Long::sum);
            }
        }
        List<DashboardJefeArchivoDTO.EstadoTotal> porEstado = estados.entrySet().stream()
                .map(entry -> new DashboardJefeArchivoDTO.EstadoTotal(entry.getKey(), entry.getValue()))
                .toList();

        RegistroCuadernoRojo cuaderno = cuadernoRepository.findByFecha(fecha).orElse(null);

        return new DashboardJefeArchivoDTO(
                fecha,
                salidas.size(),
                totalClinicaMujer,
                totalActivos,
                totalPasivos,
                porEstacionList,
                porEstado,
                porEtiqueta,
                new DashboardJefeArchivoDTO.CuadernoRojoResumen(
                        fecha,
                        cuaderno != null ? cuaderno.getEgresosHospitalarios() : 0,
                        cuaderno != null ? cuaderno.getSobresEmergencia() : 0,
                        cuaderno != null ? cuaderno.getSobresSellados() : 0,
                        cuaderno != null ? cuaderno.getTia() : 0,
                        cuaderno != null));
    }

    /** Cuenta las salidas por etiqueta, ordenadas por el orden del catálogo. */
    private static List<DashboardJefeArchivoDTO.EtiquetaTotal> contarEtiquetas(
            List<SalidaArchivoHospital> salidas) {
        Map<String, ConteoEtiqueta> conteos = new LinkedHashMap<>();
        for (SalidaArchivoHospital salida : salidas) {
            EtiquetaArchivo etiqueta = salida.getEtiqueta();
            String nombre = etiqueta != null
                    ? etiqueta.getNombre()
                    : (salida.isEsClinicaMujer() ? "Clínica de la Mujer" : "Sin etiqueta");
            String codigo = etiqueta != null
                    ? etiqueta.getCodigo()
                    : (salida.isEsClinicaMujer() ? EtiquetaArchivoService.CODIGO_CLINICA_MUJER : null);
            String color = etiqueta != null
                    ? etiqueta.getColor()
                    : (salida.isEsClinicaMujer() ? "rose" : "slate");
            int orden = (etiqueta != null && etiqueta.getOrden() != null)
                    ? etiqueta.getOrden()
                    : (salida.isEsClinicaMujer() ? 10 : Integer.MAX_VALUE);
            String clave = codigo != null ? codigo : nombre;
            ConteoEtiqueta conteo = conteos.computeIfAbsent(
                    clave, k -> new ConteoEtiqueta(nombre, codigo, color, orden));
            conteo.total++;
        }
        return conteos.values().stream()
                .sorted(Comparator.comparingInt((ConteoEtiqueta c) -> c.orden)
                        .thenComparing(c -> c.nombre))
                .map(c -> new DashboardJefeArchivoDTO.EtiquetaTotal(
                        c.nombre, c.codigo, c.color, c.total))
                .toList();
    }

    private static final class ConteoEtiqueta {
        private final String nombre;
        private final String codigo;
        private final String color;
        private final int orden;
        private long total;

        private ConteoEtiqueta(String nombre, String codigo, String color, int orden) {
            this.nombre = nombre;
            this.codigo = codigo;
            this.color = color;
            this.orden = orden;
        }
    }

    private Long umbralActivo() {
        String valor = parametros.obtener(ParametroSistemaService.UMBRAL_ARCHIVO_ACTIVO, null);
        try {
            return (valor != null && !valor.isBlank()) ? Long.valueOf(valor.trim()) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String clasificar(String numeroExpediente, Long umbral) {
        if (umbral == null || numeroExpediente == null) {
            return null;
        }
        try {
            return Long.parseLong(numeroExpediente.trim()) > umbral ? "activo" : "pasivo";
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
