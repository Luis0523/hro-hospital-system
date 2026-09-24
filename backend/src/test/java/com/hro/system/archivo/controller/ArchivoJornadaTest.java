package com.hro.system.archivo.controller;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.repository.DiaNoLaborableRepository;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.entity.UbicacionArchivo;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteMovimientoRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.archivo.repository.UbicacionArchivoRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ArchivoJornadaTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DiaNoLaborableRepository diaNoLaborableRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private ExpedienteCicloRepository expedienteCicloRepository;

    @Autowired
    private ExpedienteMovimientoRepository expedienteMovimientoRepository;

    @Autowired
    private UbicacionArchivoRepository ubicacionArchivoRepository;

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

    private static final LocalDate FECHA = LocalDate.of(2026, 11, 9);

    private UsuarioReferencia usuario;
    private Paciente paciente;
    private Subespecialidad subespecialidad;
    private MedicoSubespecialidad programacion;
    private Cita cita;

    @BeforeEach
    void setUp() {
        expedienteMovimientoRepository.deleteAll();
        expedienteCicloRepository.deleteAll();
        expedienteRepository.deleteAll();
        ubicacionArchivoRepository.deleteAll();
        diaNoLaborableRepository.deleteAll();
        citaRepository.deleteAll();
        cupoDiarioRepository.deleteAll();
        medicoSubespecialidadRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioRepository.deleteAll();
        pacienteRepository.deleteAll();

        usuario = usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("archivo-jornada-01")
                .nombreMostrar("Archivo Pruebas")
                .rolPrincipal("archivo")
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

        short diaSemana = (short) FECHA.getDayOfWeek().getValue();
        programacion = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad)
                .diaSemana(diaSemana)
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
                .numeroExpediente("EXP-001234")
                .build());

        cita = crearCita(programacion, paciente);
    }

    private Cita crearCita(MedicoSubespecialidad ms, Paciente p) {
        CupoDiario cupo = cupoDiarioRepository.save(CupoDiario.builder()
                .medicoSubespecialidad(ms)
                .fecha(FECHA)
                .capacidadMaxima(10)
                .cuposOcupados(1)
                .build());
        return citaRepository.save(Cita.builder()
                .paciente(p)
                .cupoDiario(cupo)
                .horaEstimada(LocalTime.of(8, 30))
                .estado("confirmada")
                .registradoPor(usuario)
                .build());
    }

    @Test
    @DisplayName("GET /expedientes/jornada - Devuelve las citas del día con su expediente (sin ciclo)")
    void jornada_sinCiclo() throws Exception {
        expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente("EXP-001234")
                .activo(true)
                .build());

        mockMvc.perform(get("/expedientes/jornada").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].citaId", is(cita.getId().intValue())))
                .andExpect(jsonPath("$.data[0].pacienteNombre", is("Juan López")))
                .andExpect(jsonPath("$.data[0].numeroExpediente", is("EXP-001234")))
                .andExpect(jsonPath("$.data[0].subespecialidadId", is(subespecialidad.getId().intValue())))
                .andExpect(jsonPath("$.data[0].estadoActual", is("sin_ciclo")))
                .andExpect(jsonPath("$.data[0].cicloId").doesNotExist());
    }

    @Test
    @DisplayName("GET /expedientes/jornada - Refleja el estado del ciclo cuando existe")
    void jornada_conCiclo() throws Exception {
        Expediente expediente = expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente("EXP-001234")
                .activo(true)
                .build());
        expedienteCicloRepository.save(ExpedienteCiclo.builder()
                .expediente(expediente)
                .cita(cita)
                .estadoActual("en_busqueda")
                .build());

        mockMvc.perform(get("/expedientes/jornada").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].estadoActual", is("en_busqueda")))
                .andExpect(jsonPath("$.data[0].cicloId", notNullValue()));
    }

    @Test
    @DisplayName("GET /expedientes/jornada - Filtra por subespecialidad")
    void jornada_filtroSubespecialidad() throws Exception {
        Subespecialidad otra = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(subespecialidad.getEspecialidad())
                .nombre("Cardiología Clínica")
                .activo(true)
                .build());
        MedicoSubespecialidad otraProg = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(programacion.getMedico())
                .subespecialidad(otra)
                .diaSemana((short) FECHA.getDayOfWeek().getValue())
                .horaInicio(LocalTime.of(14, 0))
                .horaFin(LocalTime.of(18, 0))
                .capacidadMaxima(5)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());
        crearCita(otraProg, paciente);

        mockMvc.perform(get("/expedientes/jornada").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));

        mockMvc.perform(get("/expedientes/jornada")
                        .param("fecha", FECHA.toString())
                        .param("subespecialidadId", subespecialidad.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].subespecialidadId", is(subespecialidad.getId().intValue())));
    }

    @Test
    @DisplayName("GET /expedientes/jornada - Fecha sin citas devuelve lista vacía")
    void jornada_fechaSinCitas() throws Exception {
        mockMvc.perform(get("/expedientes/jornada").param("fecha", FECHA.plusDays(1).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }
}
