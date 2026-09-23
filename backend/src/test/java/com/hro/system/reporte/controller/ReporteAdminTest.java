package com.hro.system.reporte.controller;

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
class ReporteAdminTest {

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
    private MedicoSubespecialidadRepository medicoSubespecialidadRepository;

    private static final LocalDate FECHA1 = LocalDate.of(2026, 11, 9);
    private static final LocalDate FECHA2 = LocalDate.of(2026, 11, 10);

    private UsuarioReferencia usuario;
    private Paciente paciente;
    private MedicoSubespecialidad programacion;
    private Subespecialidad subespecialidad;

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
                .idExterno("admin-rep-01")
                .nombreMostrar("Admin Reportes")
                .rolPrincipal("administrador")
                .activo(true)
                .build());

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna")
                .activo(true)
                .build());

        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Medicina General")
                .activo(true)
                .build());

        Medico medico = medicoRepository.save(Medico.builder()
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

    private CupoDiario crearCupo(LocalDate fecha, int capacidad, int ocupados) {
        return cupoDiarioRepository.save(CupoDiario.builder()
                .medicoSubespecialidad(programacion)
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
    @DisplayName("GET /reportes/citas-por-estado - Cuenta citas por estado en el rango")
    void citasPorEstado() throws Exception {
        CupoDiario cupo1 = crearCupo(FECHA1, 2, 2);
        crearCita(cupo1, "atendida");
        CupoDiario cupo2 = crearCupo(FECHA2, 4, 1);
        crearCita(cupo2, "no_asistio");
        crearCita(cupo2, "confirmada");

        mockMvc.perform(get("/reportes/citas-por-estado")
                        .param("fechaInicio", FECHA1.toString())
                        .param("fechaFin", FECHA2.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total", is(3)))
                .andExpect(jsonPath("$.data.porEstado.atendida", is(1)))
                .andExpect(jsonPath("$.data.porEstado.no_asistio", is(1)))
                .andExpect(jsonPath("$.data.porEstado.confirmada", is(1)));
    }

    @Test
    @DisplayName("GET /reportes/demanda-por-especialidad - Agrupa por especialidad")
    void demandaPorEspecialidad() throws Exception {
        CupoDiario cupo1 = crearCupo(FECHA1, 2, 2);
        crearCita(cupo1, "atendida");
        CupoDiario cupo2 = crearCupo(FECHA2, 4, 1);
        crearCita(cupo2, "no_asistio");

        mockMvc.perform(get("/reportes/demanda-por-especialidad")
                        .param("fechaInicio", FECHA1.toString())
                        .param("fechaFin", FECHA2.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].especialidadNombre", is("Medicina Interna")))
                .andExpect(jsonPath("$.data.items[0].totalCitas", is(2)))
                .andExpect(jsonPath("$.data.items[0].atendidas", is(1)))
                .andExpect(jsonPath("$.data.items[0].inasistencias", is(1)));
    }

    @Test
    @DisplayName("GET /reportes/utilizacion-cupos - Calcula capacidad, ocupados y porcentaje")
    void utilizacionCupos() throws Exception {
        CupoDiario cupo1 = crearCupo(FECHA1, 2, 2);
        crearCita(cupo1, "atendida");
        CupoDiario cupo2 = crearCupo(FECHA2, 4, 1);
        crearCita(cupo2, "confirmada");

        mockMvc.perform(get("/reportes/utilizacion-cupos")
                        .param("fechaInicio", FECHA1.toString())
                        .param("fechaFin", FECHA2.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.capacidadTotal", is(6)))
                .andExpect(jsonPath("$.data.cuposOcupados", is(3)))
                .andExpect(jsonPath("$.data.cuposDisponibles", is(3)))
                .andExpect(jsonPath("$.data.utilizacionPorcentaje", is(50.0)));
    }

    @Test
    @DisplayName("GET /reportes/citas-por-estado - Rechaza rango inválido")
    void rangoInvalido() throws Exception {
        mockMvc.perform(get("/reportes/citas-por-estado")
                        .param("fechaInicio", FECHA2.toString())
                        .param("fechaFin", FECHA1.toString()))
                .andExpect(status().isBadRequest());
    }
}
