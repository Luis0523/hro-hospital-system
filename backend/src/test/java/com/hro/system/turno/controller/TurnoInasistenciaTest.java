package com.hro.system.turno.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.cita.dto.CierreDiarioRequestDTO;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.entity.CitaEstadoHistorial;
import com.hro.system.cita.repository.CitaEstadoHistorialRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.medico.entity.Medico;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.turno.dto.GenerarTurnoRequestDTO;
import com.hro.system.turno.dto.ReintegrarTurnoRequestDTO;
import com.hro.system.turno.entity.Turno;
import com.hro.system.turno.repository.ContadorTurnoDiarioRepository;
import com.hro.system.turno.repository.TurnoRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class TurnoInasistenciaTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private ContadorTurnoDiarioRepository contadorRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CitaEstadoHistorialRepository historialRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private SubespecialidadHorarioRepository subespecialidadHorarioRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private EspacioFisicoRepository espacioFisicoRepository;

    @Autowired
    private AsignacionDiariaEspacioRepository asignacionRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioReferenciaRepository;

    @Autowired
    private com.hro.system.archivo.repository.ExpedienteCicloRepository expedienteCicloRepository;

    @Autowired
    private com.hro.system.archivo.repository.ExpedienteMovimientoRepository expedienteMovimientoRepository;

    private Paciente paciente;
    private UsuarioReferencia enfermera;
    private Subespecialidad subespecialidad;
    private AsignacionDiariaEspacio asignacion;
    private CupoDiario cupoDiario;
    private LocalDate fechaHoy;

    @BeforeEach
    void setUp() {
        turnoRepository.deleteAllInBatch();
        contadorRepository.deleteAllInBatch();
        historialRepository.deleteAllInBatch();
        expedienteMovimientoRepository.deleteAllInBatch();
        expedienteCicloRepository.deleteAllInBatch();
        citaRepository.deleteAllInBatch();
        cupoDiarioRepository.deleteAllInBatch();
        asignacionRepository.deleteAllInBatch();
        subespecialidadHorarioRepository.deleteAllInBatch();

        fechaHoy = LocalDate.now();
        String suffix = UUID.randomUUID().toString().substring(0, 5);

        enfermera = usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                .idExterno("enf-" + suffix)
                .nombreMostrar("Enfermera " + suffix)
                .rolPrincipal("enfermeria")
                .activo(true)
                .build());

        paciente = pacienteRepository.save(Paciente.builder()
                .dpi("DPI-" + suffix)
                .nombres("Ana " + suffix)
                .apellidos("López")
                .fechaNacimiento(LocalDate.of(1985, 3, 20))
                .sexo("F")
                .numeroExpediente("EXP-" + suffix)
                .build());

        Especialidad esp = especialidadRepository.save(Especialidad.builder()
                .nombre("Pediatría " + suffix)
                .activo(true)
                .build());

        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(esp)
                .nombre("Pediatría General " + suffix)
                .activo(true)
                .build());

        EspacioFisico espacio = espacioFisicoRepository.save(EspacioFisico.builder()
                .numero("S-" + suffix)
                .nivel((short) 1)
                .capacidadCamillas(1)
                .nombre("Sala Pediatría " + suffix)
                .activo(true)
                .build());

        Medico medico = medicoRepository.save(Medico.builder()
                .nombres("Dra. Elena Ramos")
                .numeroColegiado("COL-" + suffix)
                .usuarioReferencia(enfermera)
                .activo(true)
                .build());

        SubespecialidadHorario medicoSubespecialidad = subespecialidadHorarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(subespecialidad)
                .diaSemana((short) fechaHoy.getDayOfWeek().getValue())
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(15)
                .duracionConsultaMinutos(20)
                .activo(true)
                .build());

        cupoDiario = cupoDiarioRepository.save(CupoDiario.builder()
                .subespecialidadHorario(medicoSubespecialidad)
                .fecha(fechaHoy)
                .capacidadMaxima(15)
                .cuposOcupados(1)
                .build());

        // La sala del día: asignación diaria de la subespecialidad a un espacio físico
        asignacion = asignacionRepository.save(AsignacionDiariaEspacio.builder()
                .espacioFisico(espacio)
                .subespecialidad(subespecialidad)
                .fecha(fechaHoy)
                .creadoPor(enfermera)
                .build());
    }

    @Test
    @DisplayName("Check-in de enfermería: Genera turno correlativo atómico y pasa cita a confirmada")
    void testCheckInGeneraTurnoYConfirmaCita() throws Exception {
        Cita cita = citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupoDiario)
                .estado("pendiente")
                .registradoPor(enfermera)
                .build());

        GenerarTurnoRequestDTO request = GenerarTurnoRequestDTO.builder()
                .citaId(cita.getId())
                .usuarioId(enfermera.getId())
                .build();

        mockMvc.perform(post("/turnos/check-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.numeroTurno", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.estado").value("en_espera"))
                .andExpect(jsonPath("$.data.asignacionDiariaEspacioId").value(asignacion.getId()));

        Cita citaActualizada = citaRepository.findById(cita.getId()).orElseThrow();
        assertEquals("confirmada", citaActualizada.getEstado());

        List<CitaEstadoHistorial> historial = historialRepository.findByCitaIdOrderByFechaCambioDesc(cita.getId());
        assertFalse(historial.isEmpty());
        assertEquals("confirmada", historial.get(0).getEstadoNuevo());
        assertEquals("pendiente", historial.get(0).getEstadoAnterior());
    }

    @Test
    @DisplayName("Flujo de Llamado, No Responde y Reintegración en el Mismo Día")
    void testFlujoLlamadoNoRespondeYReintegracion() throws Exception {
        Cita cita = citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupoDiario)
                .estado("pendiente")
                .registradoPor(enfermera)
                .build());

        GenerarTurnoRequestDTO checkInReq = GenerarTurnoRequestDTO.builder()
                .citaId(cita.getId())
                .usuarioId(enfermera.getId())
                .build();

        String checkInResp = mockMvc.perform(post("/turnos/check-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkInReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long turnoId = objectMapper.readTree(checkInResp).get("data").get("id").asLong();

        mockMvc.perform(post("/turnos/" + turnoId + "/llamar?usuarioId=" + enfermera.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("llamado"))
                .andExpect(jsonPath("$.data.intentosLlamado").value(1));

        mockMvc.perform(post("/turnos/" + turnoId + "/no-responde?usuarioId=" + enfermera.getId() + "&motivo=PacienteNoSePresento"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("no_responde"));

        ReintegrarTurnoRequestDTO reprogReq = ReintegrarTurnoRequestDTO.builder()
                .usuarioId(enfermera.getId())
                .motivo("Regresó de laboratorio con resultados")
                .build();

        mockMvc.perform(post("/turnos/" + turnoId + "/reintegrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reprogReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(turnoId))
                .andExpect(jsonPath("$.data.citaId").value(cita.getId()))
                .andExpect(jsonPath("$.data.numeroTurno", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.estado").value("reintegrado"));

        Turno turnoFinal = turnoRepository.findById(turnoId).orElseThrow();
        assertTrue(turnoFinal.getNumeroTurno() >= 1);
        assertEquals("reintegrado", turnoFinal.getEstado());
        assertEquals(0, turnoFinal.getIntentosLlamado());
    }

    @Test
    @DisplayName("Cierre del Día: Turno no responde se marca como 'no_asistio' SIN liberar cupo")
    void testCierreDiarioMarcaNoAsistioSinLiberarCupo() throws Exception {
        Cita cita = citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupoDiario)
                .estado("confirmada")
                .registradoPor(enfermera)
                .build());

        turnoRepository.save(Turno.builder()
                .cita(cita)
                .asignacionDiariaEspacio(asignacion)
                .numeroTurno(1)
                .estado("no_responde")
                .intentosLlamado(3)
                .build());

        cupoDiario.setCuposOcupados(1);
        cupoDiarioRepository.save(cupoDiario);

        CierreDiarioRequestDTO cierreReq = CierreDiarioRequestDTO.builder()
                .fecha(fechaHoy)
                .subespecialidadId(subespecialidad.getId())
                .usuarioId(enfermera.getId())
                .build();

        mockMvc.perform(post("/turnos/cierre-diario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cierreReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(1));

        Cita citaActualizada = citaRepository.findById(cita.getId()).orElseThrow();
        assertEquals("no_asistio", citaActualizada.getEstado());

        List<CitaEstadoHistorial> historial = historialRepository.findByCitaIdOrderByFechaCambioDesc(cita.getId());
        assertEquals("no_asistio", historial.get(0).getEstadoNuevo());

        CupoDiario cupoFinal = cupoDiarioRepository.findById(cupoDiario.getId()).orElseThrow();
        assertEquals(1, cupoFinal.getCuposOcupados(), "El cupo diario NO debe liberarse en el cierre del día");
    }
}
