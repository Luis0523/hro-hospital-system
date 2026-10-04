package com.hro.system.estacion.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.estacion.dto.AsignarSubespecialidadesRequestDTO;
import com.hro.system.estacion.dto.CrearEstacionRequestDTO;
import com.hro.system.estacion.repository.EstacionAccesoRepository;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.estacion.repository.EstacionSubespecialidadRepository;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EstacionAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EstacionAccesoRepository accesoRepository;

    @Autowired
    private EstacionSubespecialidadRepository estacionSubRepository;

    @Autowired
    private EstacionEnfermeriaRepository estacionRepository;

    @Autowired
    private SubespecialidadHorarioRepository horarioRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    private Subespecialidad medicinaGeneral;   // con horario lunes
    private Subespecialidad pediatriaGeneral;  // sin horario
    private Subespecialidad cardiologia;       // con horario lunes

    @BeforeEach
    void setUp() {
        accesoRepository.deleteAll();
        estacionSubRepository.deleteAll();
        estacionRepository.deleteAll();
        horarioRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();

        Especialidad medicina = especialidadRepository.save(Especialidad.builder().nombre("Medicina Interna").activo(true).build());
        Especialidad pediatria = especialidadRepository.save(Especialidad.builder().nombre("Pediatría").activo(true).build());
        Especialidad cardio = especialidadRepository.save(Especialidad.builder().nombre("Cardiología").activo(true).build());

        medicinaGeneral = subespecialidadRepository.save(Subespecialidad.builder().especialidad(medicina).nombre("Medicina General").activo(true).build());
        pediatriaGeneral = subespecialidadRepository.save(Subespecialidad.builder().especialidad(pediatria).nombre("Pediatría General").activo(true).build());
        cardiologia = subespecialidadRepository.save(Subespecialidad.builder().especialidad(cardio).nombre("Cardiología Clínica").activo(true).build());

        horarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(medicinaGeneral).diaSemana((short) 1)
                .horaInicio(LocalTime.of(7, 0)).horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(12).duracionConsultaMinutos(30).activo(true).build());
        horarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(cardiologia).diaSemana((short) 1)
                .horaInicio(LocalTime.of(8, 0)).horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(6).duracionConsultaMinutos(40).activo(true).build());
        // pediatriaGeneral sin horario (no aparece ningún día)
    }

    private long crearEstacion(String codigo, String nombre) throws Exception {
        String res = mockMvc.perform(post("/estaciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CrearEstacionRequestDTO.builder()
                                .codigo(codigo).nombre(nombre).build())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(res).path("data").path("id").asLong();
    }

    private void asignar(long estacionId, List<Long> subespecialidadIds) throws Exception {
        mockMvc.perform(put("/estaciones/{id}/subespecialidades", estacionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AsignarSubespecialidadesRequestDTO.builder()
                                .subespecialidadIds(subespecialidadIds).build())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /estaciones - Crea la estación y GET la lista")
    void crearYListar() throws Exception {
        crearEstacion("EST-T1", "Consulta Externa — Pruebas");

        mockMvc.perform(get("/estaciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].codigo", is("EST-T1")))
                .andExpect(jsonPath("$.data[0].activo", is(true)));
    }

    @Test
    @DisplayName("POST /estaciones - Rechaza código duplicado")
    void codigoDuplicado() throws Exception {
        crearEstacion("EST-T1", "Consulta Externa — Pruebas");

        mockMvc.perform(post("/estaciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CrearEstacionRequestDTO.builder()
                                .codigo("EST-T1").nombre("Otra").build())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Ya existe")));
    }

    @Test
    @DisplayName("PUT /estaciones/{id}/subespecialidades - Asigna y devuelve el conjunto")
    void asignarSubespecialidades() throws Exception {
        long id = crearEstacion("EST-T1", "Medicina y Cardiología");

        asignar(id, List.of(medicinaGeneral.getId(), cardiologia.getId()));

        mockMvc.perform(get("/estaciones/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subespecialidades", hasSize(2)))
                .andExpect(jsonPath("$.data.subespecialidades[*].nombre",
                        containsInAnyOrder("Medicina General", "Cardiología Clínica")));
    }

    @Test
    @DisplayName("PUT /estaciones/{id}/subespecialidades - Pertenencia única (rechaza duplicado entre estaciones)")
    void pertenenciaUnica() throws Exception {
        long a = crearEstacion("EST-A", "Estación A");
        long b = crearEstacion("EST-B", "Estación B");
        asignar(a, List.of(medicinaGeneral.getId()));

        mockMvc.perform(put("/estaciones/{id}/subespecialidades", b)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AsignarSubespecialidadesRequestDTO.builder()
                                .subespecialidadIds(List.of(medicinaGeneral.getId())).build())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ya pertenece a la estación")));
    }

    @Test
    @DisplayName("GET /estaciones/{id}/subespecialidades-activas - Filtra por horario del día")
    void activasPorDia() throws Exception {
        long id = crearEstacion("EST-T1", "Mixta");
        asignar(id, List.of(medicinaGeneral.getId(), pediatriaGeneral.getId()));

        LocalDate lunes = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        LocalDate martes = lunes.plusDays(1);

        mockMvc.perform(get("/estaciones/{id}/subespecialidades-activas", id).param("fecha", lunes.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].nombre", is("Medicina General")));

        mockMvc.perform(get("/estaciones/{id}/subespecialidades-activas", id).param("fecha", martes.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        mockMvc.perform(get("/estaciones/{id}/subespecialidades-activas", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    @DisplayName("DELETE y PATCH /estaciones/{id} - Baja lógica y reactivación")
    void bajaYReactivar() throws Exception {
        long id = crearEstacion("EST-T1", "Pruebas");

        mockMvc.perform(delete("/estaciones/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(false)));

        mockMvc.perform(patch("/estaciones/{id}/reactivar", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.activo", is(true)));
    }

    @Test
    @DisplayName("POST /estaciones - 403 para rol no autorizado")
    void sinPermiso() throws Exception {
        mockMvc.perform(post("/estaciones")
                        .header("X-Usuario-Id", "enf-01")
                        .header("X-Usuario-Rol", "enfermeria")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CrearEstacionRequestDTO.builder()
                                .codigo("EST-X").nombre("No permitida").build())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /estaciones/{id}/acceso - Registra entrada y PATCH salida la cierra")
    void registrarYCerrarAcceso() throws Exception {
        long id = crearEstacion("EST-T1", "Pruebas");

        String creado = mockMvc.perform(post("/estaciones/{id}/acceso", id)
                        .header("X-Usuario-Id", "enfermeria-01")
                        .header("X-Usuario-Rol", "enfermeria"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.entradoEn", notNullValue()))
                .andExpect(jsonPath("$.data.salidoEn", nullValue()))
                .andReturn().getResponse().getContentAsString();
        String accesoId = objectMapper.readTree(creado).path("data").path("id").asText();

        mockMvc.perform(patch("/estaciones/acceso/{accesoId}/salida", accesoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.salidoEn", notNullValue()));
    }

    @Test
    @DisplayName("Entrar a otra estación cierra el acceso abierto previo del mismo usuario")
    void cambiarEstacionCierraAccesoAnterior() throws Exception {
        long a = crearEstacion("EST-A", "Estación A");
        long b = crearEstacion("EST-B", "Estación B");

        mockMvc.perform(post("/estaciones/{id}/acceso", a)
                .header("X-Usuario-Id", "enfermeria-01").header("X-Usuario-Rol", "enfermeria"));
        mockMvc.perform(post("/estaciones/{id}/acceso", b)
                .header("X-Usuario-Id", "enfermeria-01").header("X-Usuario-Rol", "enfermeria"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/estaciones/{id}/accesos", a).param("abiertos", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        mockMvc.perform(get("/estaciones/{id}/accesos", a))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].salidoEn", notNullValue()));
    }

    @Test
    @DisplayName("CORS - El preflight acepta el header X-Estacion-Id")
    void corsPreflightPermiteHeaderEstacion() throws Exception {
        mockMvc.perform(options("/estaciones")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "X-Estacion-Id"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Headers", containsStringIgnoringCase("X-Estacion-Id")));
    }
}
