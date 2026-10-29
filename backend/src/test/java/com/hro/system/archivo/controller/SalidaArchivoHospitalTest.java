package com.hro.system.archivo.controller;

import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.integracion.dto.PacienteHroDTO;
import com.hro.system.integracion.service.ExpedienteHroService;
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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Salidas de archivo consultadas al hospital: registra consultando el API
 * (mockeado), es idempotente por estación/fecha y lista por estación.
 */
@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
class SalidaArchivoHospitalTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private EstacionEnfermeriaRepository estacionRepository;

    @MockBean
    private ExpedienteHroService expedienteHroService;

    private EstacionEnfermeria estacion;
    private LocalDate fecha;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        estacion = estacionRepository.save(EstacionEnfermeria.builder()
                .codigo("SA-" + suffix)
                .nombre("Estación " + suffix)
                .activo(true)
                .build());
        fecha = LocalDate.of(2032, 3, 10 + (int) (Math.random() * 15));

        when(expedienteHroService.consultar(anyString())).thenAnswer(inv ->
                PacienteHroDTO.builder()
                        .numeroExpediente(inv.getArgument(0))
                        .nombreCompleto("Paciente de Prueba")
                        .build());
    }

    private String body(String numero) {
        return "{\"numeroExpediente\":\"" + numero + "\",\"estacionId\":" + estacion.getId()
                + ",\"fecha\":\"" + fecha + "\"}";
    }

    @Test
    @DisplayName("Registra la salida consultando al hospital y la lista por estación")
    void registraYLista() throws Exception {
        String numero = "9" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-archivo-hospital")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-salida")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content(body(numero)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.numeroExpediente").value(numero))
                .andExpect(jsonPath("$.data.pacienteNombre").value("Paciente de Prueba"));

        mockMvc.perform(get("/salidas-archivo-hospital")
                        .param("fecha", fecha.toString())
                        .param("estacionId", String.valueOf(estacion.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].numeroExpediente").value(numero));
    }

    @Test
    @DisplayName("Guarda la marca de Clínica de la Mujer para la estadística")
    void guardaClinicaMujer() throws Exception {
        String numero = "9" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-archivo-hospital")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-salida")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content("{\"numeroExpediente\":\"" + numero + "\",\"estacionId\":"
                                + estacion.getId() + ",\"fecha\":\"" + fecha
                                + "\",\"esClinicaMujer\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.esClinicaMujer").value(true));

        mockMvc.perform(get("/salidas-archivo-hospital")
                        .param("fecha", fecha.toString())
                        .param("estacionId", String.valueOf(estacion.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].esClinicaMujer").value(true));
    }

    @Test
    @DisplayName("El registro manual no consulta al hospital y aparece en el listado")
    void registroManualNoConsultaHospital() throws Exception {
        String numero = "6" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-archivo-hospital/manual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-salida")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content("{\"numeroExpediente\":\"" + numero + "\",\"pacienteNombre\":"
                                + "\"Paciente Registrado Manualmente\",\"estacionId\":"
                                + estacion.getId() + ",\"fecha\":\"" + fecha + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.numeroExpediente").value(numero))
                .andExpect(jsonPath("$.data.pacienteNombre")
                        .value("Paciente Registrado Manualmente"));

        verify(expedienteHroService, never()).consultar(anyString());

        mockMvc.perform(get("/salidas-archivo-hospital")
                        .param("fecha", fecha.toString())
                        .param("estacionId", String.valueOf(estacion.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].pacienteNombre")
                        .value("Paciente Registrado Manualmente"));
    }

    @Test
    @DisplayName("El mismo expediente en la misma estación/fecha es 409")
    void duplicado() throws Exception {
        String numero = "9" + (10000 + (int) (Math.random() * 80000));
        mockMvc.perform(post("/salidas-archivo-hospital")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Usuario-Id", "arch-test-salida")
                .header("X-Usuario-Rol", "archivo")
                .header("X-Usuario-Nombre", "Archivo")
                .content(body(numero)));
        mockMvc.perform(post("/salidas-archivo-hospital")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-salida")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content(body(numero)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Sin estación responde 400")
    void sinEstacion() throws Exception {
        mockMvc.perform(post("/salidas-archivo-hospital")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Usuario-Id", "arch-test-salida")
                        .header("X-Usuario-Rol", "archivo")
                        .header("X-Usuario-Nombre", "Archivo")
                        .content("{\"numeroExpediente\":\"123456\",\"fecha\":\"" + fecha + "\"}"))
                .andExpect(status().isBadRequest());
    }
}
