package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.DashboardJefeArchivoDTO;
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
import java.util.Comparator;
import java.util.HashMap;
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
        Map<Long, long[]> porEstacion = new LinkedHashMap<>();
        Map<Long, String> nombres = new LinkedHashMap<>();
        Map<String, Long> conteoEtiquetas = new LinkedHashMap<>();
        Map<String, Integer> ordenEtiquetas = new HashMap<>();
        long totalClinicaMujer = 0;
        long totalActivos = 0;
        long totalPasivos = 0;

        for (SalidaArchivoHospital salida : salidas) {
            Long estacionId = salida.getEstacion() != null ? salida.getEstacion().getId() : null;
            long[] contadores = porEstacion.computeIfAbsent(estacionId, k -> new long[4]);
            contadores[0]++;
            if (salida.isEsClinicaMujer()) {
                contadores[1]++;
                totalClinicaMujer++;
            }
            String clasificacion = clasificar(salida.getNumeroExpediente(), umbral);
            if ("activo".equals(clasificacion)) {
                contadores[2]++;
                totalActivos++;
            } else if ("pasivo".equals(clasificacion)) {
                contadores[3]++;
                totalPasivos++;
            }
            if (estacionId != null && salida.getEstacion().getNombre() != null) {
                nombres.putIfAbsent(estacionId, salida.getEstacion().getNombre());
            }

            String nombreEtiqueta = salida.getEtiqueta() != null
                    ? salida.getEtiqueta().getNombre()
                    : (salida.isEsClinicaMujer() ? "Clínica de la Mujer" : "Sin etiqueta");
            conteoEtiquetas.merge(nombreEtiqueta, 1L, Long::sum);
            if (salida.getEtiqueta() != null) {
                ordenEtiquetas.putIfAbsent(nombreEtiqueta,
                        salida.getEtiqueta().getOrden() != null
                                ? salida.getEtiqueta().getOrden()
                                : Integer.MAX_VALUE);
            }
        }

        List<DashboardJefeArchivoDTO.EtiquetaTotal> porEtiqueta = conteoEtiquetas.entrySet().stream()
                .sorted(Comparator
                        .comparingInt((Map.Entry<String, Long> e) -> "Sin etiqueta".equals(e.getKey())
                                ? Integer.MAX_VALUE
                                : ordenEtiquetas.getOrDefault(e.getKey(), Integer.MAX_VALUE))
                        .thenComparing(Map.Entry::getKey))
                .map(e -> new DashboardJefeArchivoDTO.EtiquetaTotal(e.getKey(), e.getValue()))
                .toList();

        List<DashboardJefeArchivoDTO.EstacionSalidaTotal> porEstacionList = porEstacion.entrySet().stream()
                .map(entry -> new DashboardJefeArchivoDTO.EstacionSalidaTotal(
                        entry.getKey(),
                        nombres.get(entry.getKey()),
                        entry.getValue()[0],
                        entry.getValue()[1],
                        entry.getValue()[2],
                        entry.getValue()[3]))
                .sorted((a, b) -> Long.compare(b.total(), a.total()))
                .toList();

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
