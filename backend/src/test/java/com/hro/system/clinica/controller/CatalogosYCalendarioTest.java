package com.hro.system.clinica.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.dto.CrearDiaNoLaborableRequestDTO;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.dto.CrearClinicaRequestDTO;
import com.hro.system.clinica.dto.CrearEspecialidadRequestDTO;
import com.hro.system.clinica.dto.CrearSubespecialidadRequestDTO;
import com.hro.system.clinica.entity.Clinica;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.ClinicaRepository;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.medico.dto.AsignarMedicoClinicaRequestDTO;
import com.hro.system.medico.dto.CrearMedicoRequestDTO;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.repository.MedicoClinicaRepository;
import com.hro.system.medico.repository.MedicoRepository;
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
class CatalogosYCalendarioTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private ClinicaRepository clinicaRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private MedicoClinicaRepository medicoClinicaRepository;

    @Autowired
    private DiaNoLaborableRepository diaNoLaborableRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioReferenciaRepository;

    private Especialidad especialidad;
    private Subespecialidad subespecialidad;
    private Clinica clinica;
    private Medico medico;
    private UsuarioReferencia usuarioAdmin;

    @BeforeEach
    void setUp() {
        citaRepository.deleteAll();
        cupoDiarioRepository.deleteAll();
        medicoClinicaRepository.deleteAll();
        diaNoLaborableRepository.deleteAll();
        clinicaRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioReferenciaRepository.deleteAll();
        pacienteRepository.deleteAll();

        usuarioAdmin = usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                .idExterno("admin-test-01")
                .nombreMostrar("Admin Prueba")
                .rolPrincipal("administrador")
                .activo(true)
                .build());

        especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna")
                .activo(true)
                .build());

        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Medicina General")
                .activo(true)
                .build());

        clinica = clinicaRepository.save(Clinica.builder()
                .subespecialidad(subespecialidad)
                .nombre("Clínica 101")
                .ubicacion("Nivel 1")
                .activo(true)
                .build());

        medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. Juan Morales")
                .numeroColegiado("COL-10452")
                .activo(true)
                .build());
    }

    @Test
    @DisplayName("POST /especialidades - Debe crear una especialidad médica")
    void crearEspecialidad_exito() throws Exception {
        CrearEspecialidadRequestDTO req = CrearEspecialidadRequestDTO.builder()
                .nombre("Pediatría")
                .build();

        mockMvc.perform(post("/especialidades")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nombre", is("Pediatría")));
    }

    @Test
    @DisplayName("POST /subespecialidades - Debe crear subespecialidad asociada")
    void crearSubespecialidad_exito() throws Exception {
        CrearSubespecialidadRequestDTO req = CrearSubespecialidadRequestDTO.builder()
                .especialidadId(especialidad.getId())
                .nombre("Cardiología Clínica")
                .build();

        mockMvc.perform(post("/subespecialidades")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nombre", is("Cardiología Clínica")))
                .andExpect(jsonPath("$.data.especialidadNombre", is("Medicina Interna")));
    }

    @Test
    @DisplayName("POST /clinicas - Debe crear clínica con ubicación")
    void crearClinica_exito() throws Exception {
        CrearClinicaRequestDTO req = CrearClinicaRequestDTO.builder()
                .subespecialidadId(subespecialidad.getId())
                .nombre("Clínica 102 - Cardiología")
                .ubicacion("Edificio Consulta Externa, Nivel 1")
                .build();

        mockMvc.perform(post("/clinicas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.nombre", is("Clínica 102 - Cardiología")));
    }

    @Test
    @DisplayName("POST /medicos - Debe registrar médico especialista")
    void crearMedico_exito() throws Exception {
        CrearMedicoRequestDTO req = CrearMedicoRequestDTO.builder()
                .nombres("Dra. Carmen Fuentes")
                .numeroColegiado("COL-12890")
                .build();

        mockMvc.perform(post("/medicos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.numeroColegiado", is("COL-12890")));
    }

    @Test
    @DisplayName("POST /medico-clinicas - Debe asignar horario y cupo a médico en clínica")
    void asignarHorarioMedico_exito() throws Exception {
        AsignarMedicoClinicaRequestDTO req = AsignarMedicoClinicaRequestDTO.builder()
                .medicoId(medico.getId())
                .clinicaId(clinica.getId())
                .diaSemana((short) 1) // Lunes
                .horaInicio(LocalTime.of(7, 0))
                .horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(20)
                .duracionConsultaMinutos(30)
                .build();

        mockMvc.perform(post("/medico-clinicas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.diaSemanaNombre", is("Lunes")))
                .andExpect(jsonPath("$.data.capacidadMaxima", is(20)));
    }

    @Test
    @DisplayName("POST /dias-no-laborables - Debe registrar día no laborable cuando no hay citas")
    void registrarDiaNoLaborable_exito() throws Exception {
        CrearDiaNoLaborableRequestDTO req = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(LocalDate.of(2026, 9, 15))
                .motivo("Día de la Independencia")
                .creadoPorId(usuarioAdmin.getId())
                .build();

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.motivo", is("Día de la Independencia")));
    }

    @Test
    @DisplayName("POST /dias-no-laborables - Debe rechazar bloqueo si existen citas en esa fecha (HU-15)")
    void registrarDiaNoLaborable_rechazoPorCitasExistentes() throws Exception {
        LocalDate fecha = LocalDate.of(2026, 9, 20);

        // Crear asignación médico clínica
        com.hro.system.medico.entity.MedicoClinica mc = medicoClinicaRepository.save(com.hro.system.medico.entity.MedicoClinica.builder()
                .medico(medico)
                .clinica(clinica)
                .diaSemana((short) 7)
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(10)
                .build());

        // Crear cupo diario
        CupoDiario cupo = cupoDiarioRepository.save(CupoDiario.builder()
                .medicoClinica(mc)
                .fecha(fecha)
                .capacidadMaxima(10)
                .cuposOcupados(1)
                .build());

        // Crear paciente
        Paciente paciente = pacienteRepository.save(Paciente.builder()
                .dpi("2984123450901")
                .nombres("Juan")
                .apellidos("López")
                .fechaNacimiento(LocalDate.of(1985, 1, 1))
                .sexo("M")
                .build());

        // Crear cita programada en esa fecha
        citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo)
                .horaEstimada(LocalTime.of(8, 30))
                .estado("confirmada")
                .registradoPor(usuarioAdmin)
                .build());

        // Intentar registrar día no laborable
        CrearDiaNoLaborableRequestDTO req = CrearDiaNoLaborableRequestDTO.builder()
                .fecha(fecha)
                .motivo("Mantenimiento no programado")
                .creadoPorId(usuarioAdmin.getId())
                .build();

        mockMvc.perform(post("/dias-no-laborables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("No se puede registrar como día no laborable: Existen 1 cita(s) programada(s)")));
    }
}
