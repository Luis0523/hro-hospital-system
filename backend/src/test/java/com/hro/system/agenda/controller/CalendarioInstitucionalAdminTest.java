package com.hro.system.agenda.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.dto.ActualizarDiaNoLaborableRequestDTO;
import com.hro.system.agenda.dto.CrearDiaNoLaborableRequestDTO;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.entity.MedicoSubespecialidad;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.medico.repository.MedicoSubespecialidadRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
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
import java.time.LocalTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CalendarioInstitucionalAdminTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DiaNoLaborableRepository diaNoLaborableRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private MedicoSubespecialidadRepository medicoSubespecialidadRepository;

    private UsuarioReferencia usuario;
    private MedicoSubespecialidad medicoSubespecialidad;
    private Paciente paciente;

    private static final LocalDate FECHA = LocalDate.of(2026, 12, 25);

    @BeforeEach
    void setUp() {
        citaRepository.deleteAll();
        cupoDiarioRepository.deleteAll();
        diaNoLaborableRepository.deleteAll();
        medicoSubespecialidadRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioRepository.deleteAll();
        pacienteRepository.deleteAll();

        usuario = usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("admin-cal-01")
                .nombreMostrar("Admin Calendario")
                .rolPrincipal("administrador")
                .activo(true)
                .build());

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna")
                .activo(true)
                .build());

        Subespecialidad subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Medicina General")
                .activo(true)
                .build());

        Medico medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. Juan Morales")
                .numeroColegiado("COL-10452")
                .activo(true)
                .build());

        medicoSubespecialidad = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad)
                .diaSemana((short) 5)
                .horaInicio(LocalTime.of(7, 0))
                .horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(10)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());

        paciente = pacienteRepository.save(Paciente.builder()
                .dpi("2984123450901")
                .nombres("Juan")
                .apellidos("López")
                .fechaNacimiento(LocalDate.of(1985, 1, 1))
                .sexo("M")
                .build());
    }

    private void crearCitaEnFecha(String estado) {
        CupoDiario cupo = cupoDiarioRepository.save(CupoDiario.builder()
                .medicoSubespecialidad(medicoSubespecialidad)
                .fecha(FECHA)
                .capacidadMaxima(10)
                .cuposOcupados(1)
                .build());

        citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo)
                .horaEstimada(LocalTime.of(8, 30))
                .estado(estado)
                .registradoPor(usuario)
                .build());
    }

    @Test
    @DisplayName("POST /dias-no-laborables - Registra la fecha cuando no hay citas")
    void registrar_sinCitas() throws Exception {
        CrearDiaNoLaborableRequestDTO req = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(FECHA)
                .motivo("Navidad")
                .creadoPorId(usuario.getId())
                .build();

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.motivo", is("Navidad")));
    }

    @Test
    @DisplayName("POST /dias-no-laborables - 409 con citas afectadas si no se fuerza")
    void registrar_conCitas_sinForzar() throws Exception {
        crearCitaEnFecha("confirmada");

        CrearDiaNoLaborableRequestDTO req = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(FECHA)
                .motivo("Asueto")
                .creadoPorId(usuario.getId())
                .build();

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.codigo", is("DIA_NO_LABORABLE_CON_CITAS")))
                .andExpect(jsonPath("$.data.totalCitas", is(1)))
                .andExpect(jsonPath("$.data.citas", hasSize(1)))
                .andExpect(jsonPath("$.data.citas[0].pacienteNombre", is("Juan López")))
                .andExpect(jsonPath("$.data.citas[0].estado", is("confirmada")));
    }

    @Test
    @DisplayName("POST /dias-no-laborables - Registra forzando aunque existan citas")
    void registrar_conCitas_forzando() throws Exception {
        crearCitaEnFecha("confirmada");

        CrearDiaNoLaborableRequestDTO req = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(FECHA)
                .motivo("Asueto forzado")
                .creadoPorId(usuario.getId())
                .forzar(true)
                .build();

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.fecha", is("2026-12-25")));
    }

    @Test
    @DisplayName("POST /dias-no-laborables - Las citas canceladas no bloquean")
    void registrar_citaCanceladaNoBloquea() throws Exception {
        crearCitaEnFecha("cancelada");

        CrearDiaNoLaborableRequestDTO req = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(FECHA)
                .motivo("Asueto")
                .creadoPorId(usuario.getId())
                .build();

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /dias-no-laborables - Rechaza fecha duplicada con código estructurado")
    void registrar_duplicado() throws Exception {
        CrearDiaNoLaborableRequestDTO req = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(FECHA)
                .motivo("Navidad")
                .creadoPorId(usuario.getId())
                .build();

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("DIA_NO_LABORABLE_YA_EXISTE")));
    }

    @Test
    @DisplayName("PUT /dias-no-laborables/{id} - Edita el motivo")
    void actualizar_motivo() throws Exception {
        CrearDiaNoLaborableRequestDTO crear = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(FECHA)
                .motivo("Navidad")
                .creadoPorId(usuario.getId())
                .build();

        String body = mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crear)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(body).path("data").path("id").asLong();

        ActualizarDiaNoLaborableRequestDTO actualizar = ActualizarDiaNoLaborableRequestDTO.builder()
                .motivo("Navidad (feriado nacional)")
                .build();

        mockMvc.perform(put("/dias-no-laborables/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(actualizar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.motivo", is("Navidad (feriado nacional)")));
    }

    @Test
    @DisplayName("DELETE /dias-no-laborables/{id} - Elimina y luego responde 404")
    void eliminar() throws Exception {
        CrearDiaNoLaborableRequestDTO crear = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(FECHA)
                .motivo("Navidad")
                .creadoPorId(usuario.getId())
                .build();

        String body = mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(crear)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(body).path("data").path("id").asLong();

        mockMvc.perform(delete("/dias-no-laborables/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/dias-no-laborables/{id}", id))
                .andExpect(status().isNotFound());
    }
}
