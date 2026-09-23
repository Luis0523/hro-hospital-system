package com.hro.system.cita.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class DisponibilidadAdminTest {

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

    private static final LocalDate FECHA = LocalDate.of(2026, 10, 5);

    private UsuarioReferencia usuario;
    private Paciente paciente;
    private MedicoSubespecialidad programacion;

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
                .idExterno("admin-disp-01")
                .nombreMostrar("Admin Disponibilidad")
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

        short diaSemana = (short) FECHA.getDayOfWeek().getValue();
        programacion = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad)
                .diaSemana(diaSemana)
                .horaInicio(LocalTime.of(7, 0))
                .horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(2)
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

    private CupoDiario crearCupo(int ocupados) {
        return cupoDiarioRepository.save(CupoDiario.builder()
                .medicoSubespecialidad(programacion)
                .fecha(FECHA)
                .capacidadMaxima(2)
                .cuposOcupados(ocupados)
                .build());
    }

    @Test
    @DisplayName("GET /cupos - Devuelve el cupo con su disponibilidad")
    void consultarCupos_conDisponibilidad() throws Exception {
        crearCupo(1);

        mockMvc.perform(get("/cupos")
                        .param("medicoSubespecialidadId", programacion.getId().toString())
                        .param("fechaInicio", FECHA.toString())
                        .param("fechaFin", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].cuposDisponibles", is(1)))
                .andExpect(jsonPath("$.data[0].disponible", is(true)));
    }

    @Test
    @DisplayName("GET /cupos?soloDisponibles=true - Omite cupos llenos")
    void consultarCupos_soloDisponibles() throws Exception {
        crearCupo(2); // lleno

        mockMvc.perform(get("/cupos")
                        .param("medicoSubespecialidadId", programacion.getId().toString())
                        .param("fechaInicio", FECHA.toString())
                        .param("fechaFin", FECHA.toString())
                        .param("soloDisponibles", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    @DisplayName("GET /citas/{id}/disponibilidad - Devuelve cupos de la misma programación")
    void disponibilidadParaCita_mismaProgramacion() throws Exception {
        CupoDiario cupo = crearCupo(0);

        Cita cita = citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo)
                .horaEstimada(LocalTime.of(8, 30))
                .estado("confirmada")
                .registradoPor(usuario)
                .build());

        mockMvc.perform(get("/citas/{id}/disponibilidad", cita.getId())
                        .param("fechaInicio", FECHA.toString())
                        .param("fechaFin", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].medicoSubespecialidadId", is(programacion.getId().toString())))
                .andExpect(jsonPath("$.data[0].fecha", is(FECHA.toString())))
                .andExpect(jsonPath("$.data[0].disponible", is(true)));
    }
}
