package com.hro.system.clinica.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.clinica.dto.SubespecialidadHorarioRequestDTO;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
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

import java.time.LocalTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SubespecialidadHorarioAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SubespecialidadHorarioRepository horarioRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    private Subespecialidad subespecialidad;

    @BeforeEach
    void setUp() {
        horarioRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna").activo(true).build());
        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad).nombre("Medicina General").activo(true).build());
    }

    private String body(Short dia, LocalTime ini, LocalTime fin, int cap) throws Exception {
        return objectMapper.writeValueAsString(SubespecialidadHorarioRequestDTO.builder()
                .subespecialidadId(subespecialidad.getId())
                .diaSemana(dia)
                .horaInicio(ini)
                .horaFin(fin)
                .capacidadMaxima(cap)
                .duracionConsultaMinutos(30)
                .build());
    }

    @Test
    @DisplayName("POST /subespecialidad-horarios - Crea el horario del día")
    void crear() throws Exception {
        mockMvc.perform(post("/subespecialidad-horarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body((short) 1, LocalTime.of(8, 0), LocalTime.of(12, 0), 20)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.diaSemanaNombre", is("Lunes")))
                .andExpect(jsonPath("$.data.capacidadMaxima", is(20)));
    }

    @Test
    @DisplayName("POST /subespecialidad-horarios - Rechaza día duplicado")
    void duplicado() throws Exception {
        mockMvc.perform(post("/subespecialidad-horarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body((short) 1, LocalTime.of(8, 0), LocalTime.of(12, 0), 20)));

        mockMvc.perform(post("/subespecialidad-horarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body((short) 1, LocalTime.of(14, 0), LocalTime.of(18, 0), 10)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ya tiene un horario")));
    }

    @Test
    @DisplayName("POST /subespecialidad-horarios - Rechaza horas inválidas")
    void horasInvalidas() throws Exception {
        mockMvc.perform(post("/subespecialidad-horarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body((short) 2, LocalTime.of(12, 0), LocalTime.of(8, 0), 10)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("posterior")));
    }

    @Test
    @DisplayName("GET /subespecialidades/{id}/horarios - Lista los horarios")
    void listar() throws Exception {
        mockMvc.perform(post("/subespecialidad-horarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body((short) 3, LocalTime.of(8, 0), LocalTime.of(12, 0), 20)));

        mockMvc.perform(get("/subespecialidades/{id}/horarios", subespecialidad.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].diaSemanaNombre", is("Miércoles")));
    }

    @Test
    @DisplayName("DELETE y PATCH /subespecialidad-horarios/{id} - Baja lógica y reactivación")
    void bajaYReactivar() throws Exception {
        String created = mockMvc.perform(post("/subespecialidad-horarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body((short) 4, LocalTime.of(8, 0), LocalTime.of(12, 0), 20)))
                .andReturn().getResponse().getContentAsString();
        String id = objectMapper.readTree(created).path("data").path("id").asText();

        mockMvc.perform(delete("/subespecialidad-horarios/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(false)));

        mockMvc.perform(patch("/subespecialidad-horarios/{id}/reactivar", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(true)));
    }

    @Test
    @DisplayName("POST /subespecialidad-horarios - 403 para un rol no autorizado")
    void sinPermiso() throws Exception {
        mockMvc.perform(post("/subespecialidad-horarios")
                        .header("X-Usuario-Id", "enf-h-01")
                        .header("X-Usuario-Rol", "enfermeria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body((short) 5, LocalTime.of(8, 0), LocalTime.of(12, 0), 20)))
                .andExpect(status().isForbidden());
    }
}
