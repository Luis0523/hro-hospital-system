package com.hro.system.dashboard.controller;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.entity.DiaNoLaborable;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.medico.entity.Medico;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
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
class DashboardAdminTest {

    @Autowired
    private MockMvc mockMvc;

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
    private SubespecialidadHorarioRepository subespecialidadHorarioRepository;

    private static final LocalDate FECHA = LocalDate.of(2026, 11, 9);

    private UsuarioReferencia usuario;
    private Paciente paciente;
    private SubespecialidadHorario programacion;

    @BeforeEach
    void setUp() {
        citaRepository.deleteAll();
        cupoDiarioRepository.deleteAll();
        diaNoLaborableRepository.deleteAll();
        subespecialidadHorarioRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioRepository.deleteAll();
        pacienteRepository.deleteAll();

        usuario = usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("admin-dash-01")
                .nombreMostrar("Admin Dashboard")
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

        programacion = subespecialidadHorarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(subespecialidad)
                .diaSemana((short) 1)
                .horaInicio(LocalTime.of(7, 0))
                .horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(3)
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

    private CupoDiario crearCupo(LocalDate fecha, int capacidad, int ocupados) {
        return cupoDiarioRepository.save(CupoDiario.builder()
                .subespecialidadHorario(programacion)
                .fecha(fecha)
                .capacidadMaxima(capacidad)
                .cuposOcupados(ocupados)
                .build());
    }

    private void crearCita(CupoDiario cupo, String estado) {
        citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo)
                .horaEstimada(LocalTime.of(8, 30))
                .estado(estado)
                .registradoPor(usuario)
                .build());
    }

    @Test
    @DisplayName("GET /dashboard/resumen - Calcula citas, cupos e inasistencias")
    void resumen_indicadores() throws Exception {
        CupoDiario cupo = crearCupo(FECHA, 3, 3); // lleno
        crearCita(cupo, "confirmada");
        crearCita(cupo, "atendida");
        crearCita(cupo, "no_asistio");

        mockMvc.perform(get("/dashboard/resumen").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCitas", is(3)))
                .andExpect(jsonPath("$.data.citasConfirmadas", is(1)))
                .andExpect(jsonPath("$.data.citasAtendidas", is(1)))
                .andExpect(jsonPath("$.data.inasistencias", is(1)))
                .andExpect(jsonPath("$.data.capacidadTotal", is(3)))
                .andExpect(jsonPath("$.data.cuposOcupados", is(3)))
                .andExpect(jsonPath("$.data.cuposDisponibles", is(0)))
                .andExpect(jsonPath("$.data.tasaInasistencia", is(50.0)))
                .andExpect(jsonPath("$.data.alertas[*].codigo", hasItem("CUPOS_AGOTADOS")));
    }

    @Test
    @DisplayName("GET /dashboard/resumen - Alerta crítica si hay citas en día no laborable")
    void resumen_alertaCitasEnDiaNoLaborable() throws Exception {
        diaNoLaborableRepository.save(DiaNoLaborable.builder()
                .fecha(FECHA)
                .motivo("Asueto")
                .creadoPor(usuario)
                .build());

        CupoDiario cupo = crearCupo(FECHA, 5, 1);
        crearCita(cupo, "pendiente");

        mockMvc.perform(get("/dashboard/resumen").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alertas[*].codigo", hasItem("CITAS_EN_DIA_NO_LABORABLE")))
                .andExpect(jsonPath("$.data.alertas[?(@.codigo=='CITAS_EN_DIA_NO_LABORABLE')].severidad", hasItem("CRITICA")));
    }

    @Test
    @DisplayName("GET /dashboard/resumen - Alerta informativa de días no laborables próximos")
    void resumen_alertaProximosDiasNoLaborables() throws Exception {
        diaNoLaborableRepository.save(DiaNoLaborable.builder()
                .fecha(FECHA.plusDays(3))
                .motivo("Feriado")
                .creadoPor(usuario)
                .build());

        mockMvc.perform(get("/dashboard/resumen").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alertas[*].codigo", hasItem("DIAS_NO_LABORABLES_PROXIMOS")));
    }
}
