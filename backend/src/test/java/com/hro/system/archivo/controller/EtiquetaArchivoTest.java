package com.hro.system.archivo.controller;

import com.hro.system.archivo.entity.EtiquetaArchivo;
import com.hro.system.archivo.repository.EtiquetaArchivoRepository;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.service.ExpedienteHroService;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Catálogo de etiquetas de Archivo y su asignación por estación: alta, baja
 * lógica, asignación, uso en la salida al Registro Médico y PDF.
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class EtiquetaArchivoTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private EstacionEnfermeriaRepository estacionRepository;
    @Autowired
    private EtiquetaArchivoRepository etiquetaRepository;

    @MockBean
    private ExpedienteHroService expedienteHroService;

    private EstacionEnfermeria estacion;
    private LocalDate fecha;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        estacion = estacionRepository.save(EstacionEnfermeria.builder()
                .codigo("ET-" + suffix)
                .nombre("Estación " + suffix)
                .activo(true)
                .build());
        fecha = LocalDate.of(2033, 4, 1 + (int) (Math.random() * 20));

        when(expedienteHroService.consultar(anyString())).thenAnswer(inv ->
                PacienteHroDTO.builder()
                        .numeroExpediente(inv.getArgument(0))
                        .nombreCompleto("Paciente de Prueba")
                        .build());
    }

    private static String codigoUnico() {
        return "etq_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String cuerpoEtiqueta(String codigo, String nombre) {
        return "{\"codigo\":\"" + codigo + "\",\"nombre\":\"" + nombre
                + "\",\"descripcion\":\"Etiqueta de prueba\",\"icono\":\"label\",\"color\":\"blue\","
                + "\"orden\":5,\"activo\":true}";
    }

    @Test
    @DisplayName("Crea, asigna a la estación y la devuelve en el listado operativo")
    void creaYAsigna() throws Exception {
        String codigo = codigoUnico();
        mockMvc.perform(post("/etiquetas-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo")
                        .content(cuerpoEtiqueta(codigo, "Etiqueta " + codigo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.codigo").value(codigo))
                .andExpect(jsonPath("$.data.activo").value(true));

        EtiquetaArchivo etiqueta = etiquetaRepository.findByCodigo(codigo).orElseThrow();

        mockMvc.perform(put("/etiquetas-archivo/estaciones/" + estacion.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo")
                        .content("{\"etiquetaIds\":[" + etiqueta.getId() + "]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(etiqueta.getId()));

        mockMvc.perform(get("/etiquetas-archivo/estaciones/" + estacion.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].codigo").value(codigo));
    }

    @Test
    @DisplayName("La salida guarda la etiqueta y la expone en el listado y el PDF")
    void salidaConEtiqueta() throws Exception {
        String codigo = codigoUnico();
        mockMvc.perform(post("/etiquetas-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo")
                        .content(cuerpoEtiqueta(codigo, "Etiqueta PDF")))
                .andExpect(status().isCreated());
        EtiquetaArchivo etiqueta = etiquetaRepository.findByCodigo(codigo).orElseThrow();
        mockMvc.perform(put("/etiquetas-archivo/estaciones/" + estacion.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo")
                        .content("{\"etiquetaIds\":[" + etiqueta.getId() + "]}"));

        String numero = "8" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-archivo-hospital")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-etiqueta")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content("{\"numeroExpediente\":\"" + numero + "\",\"estacionId\":"
                                + estacion.getId() + ",\"fecha\":\"" + fecha
                                + "\",\"etiquetaId\":" + etiqueta.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.etiqueta.id").value(etiqueta.getId()))
                .andExpect(jsonPath("$.data.etiqueta.nombre").value("Etiqueta PDF"));

        mockMvc.perform(get("/salidas-archivo-hospital")
                        .param("fecha", fecha.toString())
                        .param("estacionId", String.valueOf(estacion.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].etiqueta.codigo").value(codigo));

        mockMvc.perform(get("/salidas-archivo-hospital/pdf")
                        .param("fecha", fecha.toString())
                        .param("estacionId", String.valueOf(estacion.getId())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));

        mockMvc.perform(get("/archivo/jefe/estadisticas")
                        .param("fecha", fecha.toString())
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.porEtiqueta[?(@.codigo == '" + codigo + "')]").isNotEmpty())
                .andExpect(jsonPath("$.data.porEstacion[0].porEtiqueta").isArray());
    }

    @Test
    @DisplayName("Rechaza una etiqueta no asignada a la estación")
    void etiquetaNoAsignada() throws Exception {
        String codigo = codigoUnico();
        mockMvc.perform(post("/etiquetas-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo")
                        .content(cuerpoEtiqueta(codigo, "No asignada")))
                .andExpect(status().isCreated());
        EtiquetaArchivo etiqueta = etiquetaRepository.findByCodigo(codigo).orElseThrow();

        String numero = "7" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-archivo-hospital")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-etiqueta")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content("{\"numeroExpediente\":\"" + numero + "\",\"estacionId\":"
                                + estacion.getId() + ",\"fecha\":\"" + fecha
                                + "\",\"etiquetaId\":" + etiqueta.getId() + "}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("La baja es lógica: no elimina la fila y la quita de las activas")
    void bajaLogica() throws Exception {
        String codigo = codigoUnico();
        mockMvc.perform(post("/etiquetas-archivo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo")
                        .content(cuerpoEtiqueta(codigo, "Baja lógica")))
                .andExpect(status().isCreated());
        EtiquetaArchivo etiqueta = etiquetaRepository.findByCodigo(codigo).orElseThrow();

        mockMvc.perform(delete("/etiquetas-archivo/" + etiqueta.getId())
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo").value(false));

        assertThat(etiquetaRepository.findById(etiqueta.getId())).isPresent();

        mockMvc.perform(get("/etiquetas-archivo")
                        .header("X-Usuario-Id", "jefe-archivo-test")
                        .header("X-Usuario-Rol", "jefe_archivo")
                        .header("X-Usuario-Nombre", "Jefe Archivo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.codigo == '" + codigo + "')]").isEmpty());
    }
}
