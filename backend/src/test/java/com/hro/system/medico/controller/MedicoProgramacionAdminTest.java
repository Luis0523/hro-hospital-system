package com.hro.system.medico.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.medico.dto.ActualizarMedicoSubespecialidadRequestDTO;
import com.hro.system.medico.dto.AsignarMedicoSubespecialidadRequestDTO;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.entity.MedicoSubespecialidad;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.medico.repository.MedicoSubespecialidadRepository;
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
class MedicoProgramacionAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private MedicoSubespecialidadRepository medicoSubespecialidadRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private CitaRepository citaRepository;

    private Especialidad especialidad;
    private Subespecialidad subespecialidad;
    private Subespecialidad subespecialidad2;
    private Medico medico;
    private MedicoSubespecialidad programacion;

    @BeforeEach
    void setUp() {
        citaRepository.deleteAll();
        cupoDiarioRepository.deleteAll();
        medicoSubespecialidadRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        medicoRepository.deleteAll();

        especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna")
                .activo(true)
                .build());

        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Medicina General")
                .activo(true)
                .build());

        subespecialidad2 = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Cardiología Clínica")
                .activo(true)
                .build());

        medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. Juan Morales")
                .numeroColegiado("COL-10452")
                .activo(true)
                .build());

        programacion = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad)
                .diaSemana((short) 1)
                .horaInicio(LocalTime.of(7, 0))
                .horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(12)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());
    }

    // ---------------------------------------------------------------------
    // SCRUM-114 — Médicos
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /medicos - Por defecto solo devuelve activos")
    void listarMedicos_porDefectoActivos() throws Exception {
        medicoRepository.save(Medico.builder()
                .nombres("Dra. Ana Inactiva")
                .numeroColegiado("COL-99999")
                .activo(false)
                .build());

        mockMvc.perform(get("/medicos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].numeroColegiado", is("COL-10452")));
    }

    @Test
    @DisplayName("GET /medicos?estado=inactivos - Devuelve solo inactivos")
    void listarMedicos_inactivos() throws Exception {
        medicoRepository.save(Medico.builder()
                .nombres("Dra. Ana Inactiva")
                .numeroColegiado("COL-99999")
                .activo(false)
                .build());

        mockMvc.perform(get("/medicos").param("estado", "inactivos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].numeroColegiado", is("COL-99999")));
    }

    @Test
    @DisplayName("PATCH /medicos/{id}/reactivar - Reactiva un médico inactivo")
    void reactivarMedico_exito() throws Exception {
        Medico inactivo = medicoRepository.save(Medico.builder()
                .nombres("Dra. Ana Inactiva")
                .numeroColegiado("COL-99999")
                .activo(false)
                .build());

        mockMvc.perform(patch("/medicos/{id}/reactivar", inactivo.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.activo", is(true)));
    }

    // ---------------------------------------------------------------------
    // SCRUM-115 — Programación médica
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("GET /medico-subespecialidades?medicoId= - Filtra por médico")
    void listarProgramaciones_filtroMedico() throws Exception {
        Medico otro = medicoRepository.save(Medico.builder()
                .nombres("Dr. Otro")
                .numeroColegiado("COL-20000")
                .activo(true)
                .build());
        medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(otro)
                .subespecialidad(subespecialidad2)
                .diaSemana((short) 3)
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(8)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());

        mockMvc.perform(get("/medico-subespecialidades").param("medicoId", medico.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].medicoId", is(medico.getId().toString())));
    }

    @Test
    @DisplayName("GET /medico-subespecialidades?diaSemana= - Filtra por día")
    void listarProgramaciones_filtroDia() throws Exception {
        mockMvc.perform(get("/medico-subespecialidades").param("diaSemana", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));

        mockMvc.perform(get("/medico-subespecialidades").param("diaSemana", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    @DisplayName("GET /medico-subespecialidades?estado=inactivos - Filtra por estado")
    void listarProgramaciones_inactivas() throws Exception {
        medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad2)
                .diaSemana((short) 2)
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(8)
                .duracionConsultaMinutos(30)
                .activo(false)
                .build());

        mockMvc.perform(get("/medico-subespecialidades").param("estado", "inactivos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @DisplayName("PUT /medico-subespecialidades/{id} - Actualiza horario, capacidad y duración")
    void actualizarProgramacion_exito() throws Exception {
        ActualizarMedicoSubespecialidadRequestDTO req = ActualizarMedicoSubespecialidadRequestDTO.builder()
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(8)
                .duracionConsultaMinutos(25)
                .build();

        mockMvc.perform(put("/medico-subespecialidades/{id}", programacion.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.capacidadMaxima", is(8)))
                .andExpect(jsonPath("$.data.duracionConsultaMinutos", is(25)))
                .andExpect(jsonPath("$.data.horaInicio", is("08:00:00")));
    }

    @Test
    @DisplayName("PUT /medico-subespecialidades/{id} - Rechaza capacidad que no cabe en la jornada")
    void actualizarProgramacion_capacidadExcede() throws Exception {
        ActualizarMedicoSubespecialidadRequestDTO req = ActualizarMedicoSubespecialidadRequestDTO.builder()
                .horaInicio(LocalTime.of(7, 0))
                .horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(20)
                .duracionConsultaMinutos(30)
                .build();

        mockMvc.perform(put("/medico-subespecialidades/{id}", programacion.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("no cabe en la jornada")));
    }

    // ---------------------------------------------------------------------
    // SCRUM-116 — Validaciones
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("POST /medico-subespecialidades - Rechaza horario solapado del mismo médico y día")
    void crearProgramacion_solapada() throws Exception {
        AsignarMedicoSubespecialidadRequestDTO req = AsignarMedicoSubespecialidadRequestDTO.builder()
                .medicoId(medico.getId())
                .subespecialidadId(subespecialidad2.getId())
                .diaSemana((short) 1)
                .horaInicio(LocalTime.of(12, 0))
                .horaFin(LocalTime.of(15, 0))
                .capacidadMaxima(4)
                .duracionConsultaMinutos(30)
                .build();

        mockMvc.perform(post("/medico-subespecialidades")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("se superpone")));
    }

    @Test
    @DisplayName("PUT /medico-subespecialidades/{id} - Rechaza solapamiento con otra programación activa")
    void actualizarProgramacion_solapada() throws Exception {
        medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad2)
                .diaSemana((short) 1)
                .horaInicio(LocalTime.of(14, 0))
                .horaFin(LocalTime.of(16, 0))
                .capacidadMaxima(4)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());

        ActualizarMedicoSubespecialidadRequestDTO req = ActualizarMedicoSubespecialidadRequestDTO.builder()
                .horaInicio(LocalTime.of(10, 0))
                .horaFin(LocalTime.of(15, 0))
                .capacidadMaxima(4)
                .duracionConsultaMinutos(30)
                .build();

        mockMvc.perform(put("/medico-subespecialidades/{id}", programacion.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("se superpone")));
    }

    @Test
    @DisplayName("PATCH /medico-subespecialidades/{id}/reactivar - Rechaza si hay solapamiento")
    void reactivarProgramacion_solapada() throws Exception {
        MedicoSubespecialidad inactiva = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad2)
                .diaSemana((short) 1)
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(9, 0))
                .capacidadMaxima(2)
                .duracionConsultaMinutos(30)
                .activo(false)
                .build());

        mockMvc.perform(patch("/medico-subespecialidades/{id}/reactivar", inactiva.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("se superpone")));
    }

    @Test
    @DisplayName("PATCH /medico-subespecialidades/{id}/reactivar - Rechaza si el médico está inactivo")
    void reactivarProgramacion_medicoInactivo() throws Exception {
        Medico inactivo = medicoRepository.save(Medico.builder()
                .nombres("Dr. Retirado")
                .numeroColegiado("COL-30000")
                .activo(false)
                .build());
        MedicoSubespecialidad programacionInactiva = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(inactivo)
                .subespecialidad(subespecialidad2)
                .diaSemana((short) 1)
                .horaInicio(LocalTime.of(15, 0))
                .horaFin(LocalTime.of(16, 0))
                .capacidadMaxima(2)
                .duracionConsultaMinutos(30)
                .activo(false)
                .build());

        mockMvc.perform(patch("/medico-subespecialidades/{id}/reactivar", programacionInactiva.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("está inactivo")));
    }
}
