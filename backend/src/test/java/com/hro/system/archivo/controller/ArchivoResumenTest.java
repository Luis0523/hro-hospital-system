package com.hro.system.archivo.controller;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.repository.ActaRecepcionRepository;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteMovimientoRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ArchivoResumenTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ActaRecepcionRepository actaRepository;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private ExpedienteCicloRepository expedienteCicloRepository;

    @Autowired
    private ExpedienteMovimientoRepository expedienteMovimientoRepository;

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
    private Expediente expediente;

    @BeforeEach
    void setUp() {
        expedienteMovimientoRepository.deleteAll();
        expedienteCicloRepository.deleteAll();
        actaRepository.deleteAll();
        expedienteRepository.deleteAll();
        cupoDiarioRepository.deleteAll();
        citaRepository.deleteAll();
        subespecialidadHorarioRepository.deleteAll();
        subespecialidadRepository.deleteAll();
        especialidadRepository.deleteAll();
        medicoRepository.deleteAll();
        usuarioRepository.deleteAll();
        pacienteRepository.deleteAll();

        usuario = usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("archivo-resumen-01")
                .nombreMostrar("Archivo Resumen")
                .rolPrincipal("archivo")
                .activo(true)
                .build());

        Paciente paciente = pacienteRepository.save(Paciente.builder()
                .dpi("2984123450901")
                .nombres("Juan")
                .apellidos("López")
                .fechaNacimiento(LocalDate.of(1985, 1, 1))
                .sexo("M")
                .numeroExpediente("EXP-001234")
                .build());

        expediente = expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente("EXP-001234")
                .activo(true)
                .creadoEn(FECHA.atTime(8, 0).atOffset(ZoneOffset.UTC))
                .build());
    }

    private Cita crearCitaConCiclo(String estado, int hora) {
        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Especialidad " + hora)
                .activo(true)
                .build());
        Subespecialidad subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Sub " + hora)
                .activo(true)
                .build());
        Medico medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. " + hora)
                .numeroColegiado("COL-" + hora + "000")
                .activo(true)
                .build());
        SubespecialidadHorario ms = subespecialidadHorarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(subespecialidad)
                .diaSemana((short) FECHA.getDayOfWeek().getValue())
                .horaInicio(LocalTime.of(7, 0))
                .horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(5)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());
        CupoDiario cupo = cupoDiarioRepository.save(CupoDiario.builder()
                .subespecialidadHorario(ms)
                .fecha(FECHA)
                .capacidadMaxima(5)
                .cuposOcupados(1)
                .build());
        Cita cita = citaRepository.save(Cita.builder()
                .paciente(expediente.getPaciente())
                .cupoDiario(cupo)
                .horaEstimada(LocalTime.of(hora, 30))
                .estado("confirmada")
                .registradoPor(usuario)
                .build());
        expedienteCicloRepository.save(ExpedienteCiclo.builder()
                .expediente(expediente)
                .cita(cita)
                .estadoActual(estado)
                .build());
        return cita;
    }

    @Test
    @DisplayName("GET /archivo/resumen - Cuenta ciclos por estado y expedientes nuevos")
    void resumen() throws Exception {
        crearCitaConCiclo("pendiente_localizar", 8);
        crearCitaConCiclo("en_transito_entrega", 9);

        mockMvc.perform(get("/archivo/resumen").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCiclos", is(2)))
                .andExpect(jsonPath("$.data.pendienteLocalizar", is(1)))
                .andExpect(jsonPath("$.data.enTransitoEntrega", is(1)))
                .andExpect(jsonPath("$.data.enTransito", is(1)))
                .andExpect(jsonPath("$.data.expedientesNuevos", is(1)));
    }

    @Test
    @DisplayName("GET /archivo/resumen/pdf - Genera el PDF del resumen")
    void resumenPdf() throws Exception {
        crearCitaConCiclo("localizado", 8);

        byte[] pdf = mockMvc.perform(get("/archivo/resumen/pdf").param("fecha", FECHA.toString()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn().getResponse().getContentAsByteArray();

        assertTrue(pdf.length > 500, "El PDF debe tener contenido");
        assertEquals("%PDF", new String(pdf, 0, 4), "Debe ser un PDF válido");
    }
}
