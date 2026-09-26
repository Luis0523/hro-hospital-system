package com.hro.system.archivo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.archivo.dto.CrearActaRecepcionRequestDTO;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.repository.ActaRecepcionRepository;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteMovimientoRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ActaRecepcionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ActaRecepcionRepository actaRepository;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private ExpedienteCicloRepository expedienteCicloRepository;

    @Autowired
    private ExpedienteMovimientoRepository expedienteMovimientoRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    private static final LocalDate FECHA = LocalDate.of(2026, 11, 9);

    private Expediente expediente;

    @BeforeEach
    void setUp() {
        expedienteMovimientoRepository.deleteAll();
        expedienteCicloRepository.deleteAll();
        actaRepository.deleteAll();
        expedienteRepository.deleteAll();
        pacienteRepository.deleteAll();

        Paciente paciente = pacienteRepository.save(Paciente.builder()
                .dpi("2984123450901")
                .nombres("Juan")
                .apellidos("López")
                .fechaNacimiento(LocalDate.of(1985, 1, 1))
                .sexo("M")
                .numeroExpediente("EXP-001234")
                .build());

        expediente = expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente("EXP-001234")
                .activo(true)
                .build());
    }

    private CrearActaRecepcionRequestDTO request() {
        return CrearActaRecepcionRequestDTO.builder()
                .fecha(FECHA)
                .observaciones("Entrega de expedientes del día")
                .expedienteIds(List.of(expediente.getId()))
                .build();
    }

    @Test
    @DisplayName("POST /actas-recepcion - Crea el acta con número correlativo")
    void crearActa() throws Exception {
        mockMvc.perform(post("/actas-recepcion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.numeroActa", is("ACT-2026-0001")))
                .andExpect(jsonPath("$.data.totalExpedientes", is(1)))
                .andExpect(jsonPath("$.data.detalles", hasSize(1)))
                .andExpect(jsonPath("$.data.detalles[0].numeroExpediente", is("EXP-001234")));
    }

    @Test
    @DisplayName("GET /actas-recepcion - Lista actas por fecha")
    void listarActas() throws Exception {
        mockMvc.perform(post("/actas-recepcion")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request())));

        mockMvc.perform(get("/actas-recepcion").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].numeroActa", is("ACT-2026-0001")));

        mockMvc.perform(get("/actas-recepcion").param("fecha", FECHA.plusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    @DisplayName("GET /actas-recepcion/{id}/pdf - Genera el PDF del acta")
    void generarPdf() throws Exception {
        String body = mockMvc.perform(post("/actas-recepcion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request())))
                .andReturn().getResponse().getContentAsString();
        Long id = objectMapper.readTree(body).path("data").path("id").asLong();

        byte[] pdf = mockMvc.perform(get("/actas-recepcion/{id}/pdf", id))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn().getResponse().getContentAsByteArray();

        assertTrue(pdf.length > 500, "El PDF debe tener contenido");
        assertEquals("%PDF", new String(pdf, 0, 4), "Debe ser un PDF válido");
    }
}
