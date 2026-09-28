package com.hro.system.espacio.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.espacio.dto.CrearAsignacionDiariaRequestDTO;
import com.hro.system.espacio.entity.CierreAsignacionDiaria;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.espacio.repository.CierreAsignacionDiariaRepository;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
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
class AsignacionDiariaOperativaTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EspacioFisicoRepository espacioRepository;

    @Autowired
    private AsignacionDiariaEspacioRepository asignacionRepository;

    @Autowired
    private CierreAsignacionDiariaRepository cierreRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioRepository;

    private static final LocalDate FECHA = LocalDate.of(2026, 11, 9);

    private Subespecialidad subespecialidad;
    private EspacioFisico sala1;
    private EspacioFisico sala2;

    @BeforeEach
    void setUp() {
        cierreRepository.deleteAll();
        asignacionRepository.deleteAll();
        espacioRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        usuarioRepository.deleteAll();

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna").activo(true).build());
        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad).nombre("Medicina General").activo(true).build());

        sala1 = espacioRepository.save(EspacioFisico.builder()
                .numero("101").nivel((short) 1).capacidadCamillas(2).nombre("Sala 101").activo(true).build());
        sala2 = espacioRepository.save(EspacioFisico.builder()
                .numero("102").nivel((short) 1).capacidadCamillas(1).nombre("Sala 102").activo(true).build());
        espacioRepository.save(EspacioFisico.builder()
                .numero("201").nivel((short) 2).capacidadCamillas(3).nombre("Sala 201").activo(true).build());
    }

    private String body(EspacioFisico espacio, Long subespecialidadId) throws Exception {
        return objectMapper.writeValueAsString(CrearAsignacionDiariaRequestDTO.builder()
                .espacioFisicoId(espacio.getId())
                .subespecialidadId(subespecialidadId)
                .fecha(FECHA)
                .build());
    }

    @Test
    @DisplayName("PUT /asignaciones-diarias - Crea la selección y la vista la refleja")
    void upsert_crea() throws Exception {
        mockMvc.perform(put("/asignaciones-diarias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(sala1, subespecialidad.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subespecialidadId", is(subespecialidad.getId().intValue())))
                .andExpect(jsonPath("$.data.espacioNumero", is("101")));

        mockMvc.perform(get("/asignaciones-diarias/vista")
                        .param("fecha", FECHA.toString())
                        .param("nivel", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[?(@.espacioFisicoId=='" + sala1.getId() + "')].subespecialidadNombre",
                        hasItem("Medicina General")))
                .andExpect(jsonPath("$.data[?(@.espacioFisicoId=='" + sala2.getId() + "')].asignacionId",
                        hasItem(nullValue())));
    }

    @Test
    @DisplayName("PUT /asignaciones-diarias - Actualiza la subespecialidad si ya existe (idempotente por sala+fecha)")
    void upsert_actualiza() throws Exception {
        mockMvc.perform(put("/asignaciones-diarias")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(sala1, subespecialidad.getId())));

        Subespecialidad otra = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(subespecialidad.getEspecialidad()).nombre("Cardiología").activo(true).build());

        mockMvc.perform(put("/asignaciones-diarias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(sala1, otra.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subespecialidadId", is(otra.getId().intValue())));

        mockMvc.perform(get("/asignaciones-diarias").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @DisplayName("PUT /asignaciones-diarias - Rechaza si el día está cerrado")
    void upsert_diaCerrado() throws Exception {
        cierreRepository.save(CierreAsignacionDiaria.builder().fecha(FECHA).estado("cerrada").build());

        mockMvc.perform(put("/asignaciones-diarias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(sala1, subespecialidad.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cerrada")));
    }

    @Test
    @DisplayName("PUT /asignaciones-diarias - Rechaza si la especialidad padre está inactiva")
    void upsert_especialidadPadreInactiva() throws Exception {
        Especialidad inactiva = especialidadRepository.save(Especialidad.builder()
                .nombre("Cirugía").activo(false).build());
        Subespecialidad subInactiva = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(inactiva).nombre("Cirugía General").activo(true).build());

        mockMvc.perform(put("/asignaciones-diarias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(sala1, subInactiva.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("inactiva")));
    }

    @Test
    @DisplayName("PUT /asignaciones-diarias - 403 para un rol no autorizado")
    void upsert_sinPermiso() throws Exception {
        mockMvc.perform(put("/asignaciones-diarias")
                        .header("X-Usuario-Id", "enf-op-01")
                        .header("X-Usuario-Rol", "enfermeria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(sala1, subespecialidad.getId())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")));
    }

    @Test
    @DisplayName("GET /asignaciones-diarias - Sigue abierto para lectura (lo usa el tablero)")
    void listar_lecturaAbierta() throws Exception {
        mockMvc.perform(get("/asignaciones-diarias")
                        .header("X-Usuario-Id", "turno-op-01")
                        .header("X-Usuario-Rol", "enfermeria")
                        .param("fecha", FECHA.toString()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /asignaciones-diarias/duplicar - Copia la selección a otra fecha")
    void duplicar() throws Exception {
        mockMvc.perform(put("/asignaciones-diarias")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(sala1, subespecialidad.getId())));

        mockMvc.perform(post("/asignaciones-diarias/duplicar")
                        .param("fechaOrigen", FECHA.toString())
                        .param("fechaDestino", FECHA.plusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", is(1)));

        mockMvc.perform(get("/asignaciones-diarias").param("fecha", FECHA.plusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }
}
