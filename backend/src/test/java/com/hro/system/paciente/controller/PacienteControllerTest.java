package com.hro.system.paciente.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.paciente.dto.ActualizarPacienteRequestDTO;
import com.hro.system.paciente.dto.CrearPacienteRequestDTO;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PacienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PacienteRepository pacienteRepository;

    private Paciente pacienteGuardado;

    @BeforeEach
    void setUp() {
        pacienteRepository.deleteAll();

        Paciente p = Paciente.builder()
                .dpi("2984123450901")
                .nombres("Juan Carlos")
                .apellidos("López Morales")
                .fechaNacimiento(LocalDate.of(1985, 4, 12))
                .sexo("M")
                .telefono("55551234")
                .direccion("Zona 1, Quetzaltenango")
                .numeroExpediente("EXP-2024-001")
                .build();

        pacienteGuardado = pacienteRepository.save(p);
    }

    @Test
    @DisplayName("POST /pacientes - Debe registrar un nuevo paciente exitosamente")
    void registrarPaciente_exito() throws Exception {
        CrearPacienteRequestDTO request = CrearPacienteRequestDTO.builder()
                .dpi("1823948570901")
                .nombres("María Elena")
                .apellidos("Gómez Sac")
                .fechaNacimiento(LocalDate.of(1992, 8, 23))
                .sexo("F")
                .telefono("44445678")
                .direccion("Zona 3, Quetzaltenango")
                .numeroExpediente("EXP-2024-002")
                .build();

        mockMvc.perform(post("/pacientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.dpi", is("1823948570901")))
                .andExpect(jsonPath("$.data.nombres", is("María Elena")))
                .andExpect(jsonPath("$.data.numeroExpediente", is("EXP-2024-002")));
    }

    @Test
    @DisplayName("POST /pacientes - Debe rechazar paciente con DPI duplicado")
    void registrarPaciente_errorDpiDuplicado() throws Exception {
        CrearPacienteRequestDTO request = CrearPacienteRequestDTO.builder()
                .dpi("2984123450901") // DPI ya existente
                .nombres("Otro")
                .apellidos("Paciente")
                .fechaNacimiento(LocalDate.of(1990, 1, 1))
                .sexo("M")
                .build();

        mockMvc.perform(post("/pacientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Ya existe un paciente registrado con el DPI")));
    }

    @Test
    @DisplayName("GET /pacientes/buscar - Debe encontrar paciente por coincidencia parcial de apellido")
    void buscarMulticriterio_porApellido() throws Exception {
        mockMvc.perform(get("/pacientes/buscar")
                        .param("filtro", "López"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].apellidos", is("López Morales")));
    }

    @Test
    @DisplayName("GET /pacientes/buscar - Debe encontrar paciente por coincidencia de DPI")
    void buscarMulticriterio_porDpi() throws Exception {
        mockMvc.perform(get("/pacientes/buscar")
                        .param("filtro", "2984123450901"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].dpi", is("2984123450901")));
    }

    @Test
    @DisplayName("GET /pacientes/buscar - Debe encontrar paciente por carné/expediente")
    void buscarMulticriterio_porExpediente() throws Exception {
        mockMvc.perform(get("/pacientes/buscar")
                        .param("filtro", "EXP-2024-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].numeroExpediente", is("EXP-2024-001")));
    }

    @Test
    @DisplayName("GET /pacientes/expediente/{expediente} - Debe encontrar paciente por su expediente exacto")
    void buscarPorExpediente_exito() throws Exception {
        mockMvc.perform(get("/pacientes/expediente/EXP-2024-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nombres", is("Juan Carlos")));
    }

    @Test
    @DisplayName("PUT /pacientes/{id} - Debe actualizar datos del paciente correctamente")
    void actualizarPaciente_exito() throws Exception {
        ActualizarPacienteRequestDTO updateRequest = ActualizarPacienteRequestDTO.builder()
                .nombres("Juan Carlos Actualizado")
                .apellidos("López Morales")
                .fechaNacimiento(LocalDate.of(1985, 4, 12))
                .sexo("M")
                .telefono("50277770000")
                .direccion("Nueva Dirección, Zona 3")
                .numeroExpediente("EXP-2024-001-REV")
                .build();

        mockMvc.perform(put("/pacientes/" + pacienteGuardado.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nombres", is("Juan Carlos Actualizado")))
                .andExpect(jsonPath("$.data.telefono", is("50277770000")))
                .andExpect(jsonPath("$.data.numeroExpediente", is("EXP-2024-001-REV")));
    }

    @Test
    @DisplayName("GET /pacientes - Debe listar pacientes con paginación")
    void listarPaginado_exito() throws Exception {
        mockMvc.perform(get("/pacientes")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(1)));
    }
}
