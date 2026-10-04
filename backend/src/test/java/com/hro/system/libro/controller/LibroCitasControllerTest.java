package com.hro.system.libro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.libro.dto.LibroCitasDiaRequestDTO;
import com.hro.system.libro.dto.LibroCitasEspecialidadRequestDTO;
import com.hro.system.libro.repository.LibroCitasDiaRepository;
import com.hro.system.libro.repository.LibroCitasExpedienteRepository;
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
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LibroCitasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LibroCitasDiaRepository libroRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private LibroCitasExpedienteRepository libroExpedienteRepository;

    private static final LocalDate FECHA = LocalDate.of(2026, 11, 10);

    private Subespecialidad subespecialidad;
    private Paciente paciente;

    @BeforeEach
    void setUp() {
        libroRepository.deleteAllInBatch();
        libroExpedienteRepository.deleteAllInBatch();

        String suffix = UUID.randomUUID().toString().substring(0, 5);
        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Libro Especialidad " + suffix)
                .activo(true)
                .build());
        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Libro Sub " + suffix)
                .activo(true)
                .build());
        paciente = pacienteRepository.save(Paciente.builder()
                .dpi("DPI-LIBRO-" + suffix)
                .nombres("Ana")
                .apellidos("Libro")
                .fechaNacimiento(LocalDate.of(1990, 1, 1))
                .sexo("F")
                .numeroExpediente("1401-" + suffix.substring(0, 2))
                .build());
    }

    private LibroCitasDiaRequestDTO request(int cantidad) {
        return LibroCitasDiaRequestDTO.builder()
                .fecha(FECHA)
                .egresosHospitalarios(3)
                .sobresEmergencia(2)
                .sobresSellados(1)
                .tia(4)
                .observaciones("Jornada de prueba")
                .especialidades(List.of(LibroCitasEspecialidadRequestDTO.builder()
                        .subespecialidadId(subespecialidad.getId())
                        .cantidadExpedientes(cantidad)
                        .build()))
                .build();
    }

    private Long crearLibro(int cantidad) throws Exception {
        String resp = mockMvc.perform(post("/libro-citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request(cantidad))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(resp).path("data").path("id").asLong();
    }

    @Test
    @DisplayName("POST /libro-citas crea el día con contadores y desglose por subespecialidad")
    void crearLibro() throws Exception {
        mockMvc.perform(post("/libro-citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request(60))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.egresosHospitalarios", is(3)))
                .andExpect(jsonPath("$.data.sobresEmergencia", is(2)))
                .andExpect(jsonPath("$.data.sobresSellados", is(1)))
                .andExpect(jsonPath("$.data.tia", is(4)))
                .andExpect(jsonPath("$.data.totalExpedientes", is(60)))
                .andExpect(jsonPath("$.data.especialidades", hasSize(1)))
                .andExpect(jsonPath("$.data.especialidades[0].cantidadExpedientes", is(60)));
    }

    @Test
    @DisplayName("POST /libro-citas con fecha duplicada responde 409")
    void crearLibroDuplicado() throws Exception {
        crearLibro(10);

        mockMvc.perform(post("/libro-citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request(5))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /libro-citas/{fecha} devuelve el registro del día")
    void obtenerPorFecha() throws Exception {
        crearLibro(12);

        mockMvc.perform(get("/libro-citas/{fecha}", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalExpedientes", is(12)));
    }

    @Test
    @DisplayName("PUT /libro-citas/{id} actualiza contadores y reemplaza el desglose")
    void actualizarLibro() throws Exception {
        Long id = crearLibro(10);

        LibroCitasDiaRequestDTO actualizado = request(25);
        actualizado.setEgresosHospitalarios(9);
        actualizado.setObservaciones("Corregido");

        mockMvc.perform(put("/libro-citas/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(actualizado)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.egresosHospitalarios", is(9)))
                .andExpect(jsonPath("$.data.totalExpedientes", is(25)))
                .andExpect(jsonPath("$.data.especialidades", hasSize(1)));
    }

    @Test
    @DisplayName("GET /libro-citas/esperado devuelve el desglose (Fase 1: fuente LIBRO)")
    void esperadosConRegistro() throws Exception {
        crearLibro(60);

        mockMvc.perform(get("/libro-citas/esperado").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fuente", is("LIBRO")))
                .andExpect(jsonPath("$.data.totalExpedientes", is(60)))
                .andExpect(jsonPath("$.data.items", hasSize(1)));
    }

    @Test
    @DisplayName("GET /libro-citas/esperado sin registro devuelve lista vacía")
    void esperadosSinRegistro() throws Exception {
        mockMvc.perform(get("/libro-citas/esperado").param("fecha", "2030-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalExpedientes", is(0)))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    // ------------------------------------------------------------------
    // Libro de citas por expediente individual
    // ------------------------------------------------------------------

    private Map<String, Object> itemExpediente() {
        return Map.of(
                "numeroExpediente", paciente.getNumeroExpediente(),
                "pacienteId", paciente.getId().toString(),
                "fecha", FECHA.toString(),
                "subespecialidadId", subespecialidad.getId());
    }

    private void registrar(Map<String, Object> item) throws Exception {
        mockMvc.perform(post("/libro-citas/expedientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("items", List.of(item)))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.total", is(1)))
                .andExpect(jsonPath("$.data.insertados", is(1)));
    }

    @Test
    @DisplayName("POST /libro-citas/expedientes registra la lista de citas")
    void registrarExpedientes() throws Exception {
        registrar(itemExpediente());
    }

    @Test
    @DisplayName("POST /libro-citas/expedientes resuelve el paciente por número si falta pacienteId")
    void registrarSinPacienteId() throws Exception {
        Map<String, Object> item = Map.of(
                "numeroExpediente", paciente.getNumeroExpediente(),
                "fecha", FECHA.toString(),
                "subespecialidadId", subespecialidad.getId());
        registrar(item);
    }

    @Test
    @DisplayName("POST /libro-citas/expedientes rechaza duplicados con 409")
    void registrarDuplicado() throws Exception {
        registrar(itemExpediente());

        mockMvc.perform(post("/libro-citas/expedientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("items", List.of(itemExpediente())))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /libro-citas/expedientes devuelve 404 si el paciente no existe")
    void registrarPacienteInexistente() throws Exception {
        Map<String, Object> item = Map.of(
                "numeroExpediente", "9999-99",
                "fecha", FECHA.toString(),
                "subespecialidadId", subespecialidad.getId());
        mockMvc.perform(post("/libro-citas/expedientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("items", List.of(item)))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /libro-citas/expedientes devuelve 404 si la subespecialidad no existe")
    void registrarSubespecialidadInexistente() throws Exception {
        Map<String, Object> item = Map.of(
                "numeroExpediente", paciente.getNumeroExpediente(),
                "pacienteId", paciente.getId().toString(),
                "fecha", FECHA.toString(),
                "subespecialidadId", 999999L);
        mockMvc.perform(post("/libro-citas/expedientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("items", List.of(item)))))
                .andExpect(status().isNotFound());
    }
}
