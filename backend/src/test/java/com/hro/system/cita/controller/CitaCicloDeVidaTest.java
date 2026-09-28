package com.hro.system.cita.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.cita.dto.CancelarCitaRequestDTO;
import com.hro.system.cita.dto.CierreDiarioRequestDTO;
import com.hro.system.cita.dto.CrearCitaRequestDTO;
import com.hro.system.cita.dto.ReprogramarCitaRequestDTO;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.entity.CitaEstadoHistorial;
import com.hro.system.cita.repository.CitaEstadoHistorialRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.medico.entity.Medico;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CitaCicloDeVidaTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CitaEstadoHistorialRepository historialRepository;

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private SubespecialidadHorarioRepository subespecialidadHorarioRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private EspacioFisicoRepository espacioFisicoRepository;

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
    private UsuarioReferencia usuario;
    private Subespecialidad subespecialidad;
    private SubespecialidadHorario medicoSubespecialidad;
    private CupoDiario cupo1;
    private CupoDiario cupo2;

    @BeforeEach
    void setUp() {
        turnoRepository.deleteAllInBatch();
        historialRepository.deleteAllInBatch();
        expedienteMovimientoRepository.deleteAllInBatch();
        expedienteCicloRepository.deleteAllInBatch();
        citaRepository.deleteAllInBatch();
        cupoDiarioRepository.deleteAllInBatch();
        subespecialidadHorarioRepository.deleteAllInBatch();

        String suffix = UUID.randomUUID().toString().substring(0, 5);

        usuario = usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                .idExterno("user-" + suffix)
                .nombreMostrar("Operador Citas " + suffix)
                .rolPrincipal("personal_citas")
                .activo(true)
                .build());

        paciente = pacienteRepository.save(Paciente.builder()
                .dpi("DPI-" + suffix)
                .nombres("Carlos " + suffix)
                .apellidos("Gómez")
                .fechaNacimiento(LocalDate.of(1990, 5, 12))
                .sexo("M")
                .telefono("55512345")
                .numeroExpediente("EXP-" + suffix)
                .build());

        Especialidad esp = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna " + suffix)
                .activo(true)
                .build());

        subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(esp)
                .nombre("Cardiología " + suffix)
                .activo(true)
                .build());

        espacioFisicoRepository.save(EspacioFisico.builder()
                .numero("S-" + suffix)
                .nivel((short) 1)
                .capacidadCamillas(1)
                .nombre("Sala " + suffix)
                .activo(true)
                .build());

        Medico medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. Roberto Méndez")
                .numeroColegiado("COL-" + suffix)
                .usuarioReferencia(usuario)
                .activo(true)
                .build());

        medicoSubespecialidad = subespecialidadHorarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(subespecialidad)
                .diaSemana((short) 1) // Lunes
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(10)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());

        cupo1 = cupoDiarioRepository.save(CupoDiario.builder()
                .subespecialidadHorario(medicoSubespecialidad)
                .fecha(LocalDate.of(2026, 9, 14)) // Lunes
                .capacidadMaxima(10)
                .cuposOcupados(0)
                .build());

        cupo2 = cupoDiarioRepository.save(CupoDiario.builder()
                .subespecialidadHorario(medicoSubespecialidad)
                .fecha(LocalDate.of(2026, 9, 21)) // Siguiente Lunes
                .capacidadMaxima(10)
                .cuposOcupados(0)
                .build());
    }

    @Test
    @DisplayName("Agendar Cita: Calcula automáticamente hora estimada y ventanas con margen dinámico")
    void testAgendarCitaCalculaHoraEstimadaYVentanas() throws Exception {
        CrearCitaRequestDTO request = CrearCitaRequestDTO.builder()
                .pacienteId(paciente.getId())
                .cupoDiarioId(cupo1.getId())
                .usuarioId(usuario.getId())
                .build();

        mockMvc.perform(post("/citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.estado").value("pendiente"))
                .andExpect(jsonPath("$.data.horaEstimada").value("08:00:00"))
                .andExpect(jsonPath("$.data.horaVentanaInicio").isNotEmpty())
                .andExpect(jsonPath("$.data.horaVentanaFin").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        CupoDiario cupoActualizado = cupoDiarioRepository.findById(cupo1.getId()).orElseThrow();
        assertEquals(1, cupoActualizado.getCuposOcupados());

        List<CitaEstadoHistorial> historial = historialRepository.findAll();
        assertEquals(1, historial.size());
        assertEquals("pendiente", historial.get(0).getEstadoNuevo());
        assertNull(historial.get(0).getEstadoAnterior());
        assertEquals(usuario.getId(), historial.get(0).getUsuarioReferencia().getId());
    }

    @Test
    @DisplayName("Reprogramar Cita: Conserva cita origen en 'reprogramada', libera cupo y crea nueva cita enlazada")
    void testReprogramarCitaPreservaHistorialYCupos() throws Exception {
        CrearCitaRequestDTO agendarReq = CrearCitaRequestDTO.builder()
                .pacienteId(paciente.getId())
                .cupoDiarioId(cupo1.getId())
                .usuarioId(usuario.getId())
                .build();

        String agendarResp = mockMvc.perform(post("/citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(agendarReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long citaOriginalId = objectMapper.readTree(agendarResp).get("data").get("id").asLong();

        ReprogramarCitaRequestDTO reprogReq = ReprogramarCitaRequestDTO.builder()
                .nuevoCupoDiarioId(cupo2.getId())
                .usuarioId(usuario.getId())
                .motivo("Paciente solicitó cambio por cruce de horario")
                .build();

        String reprogResp = mockMvc.perform(post("/citas/" + citaOriginalId + "/reprogramar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reprogReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.citaOrigenId").value(citaOriginalId))
                .andExpect(jsonPath("$.data.estado").value("pendiente"))
                .andReturn().getResponse().getContentAsString();

        Long nuevaCitaId = objectMapper.readTree(reprogResp).get("data").get("id").asLong();
        assertNotEquals(citaOriginalId, nuevaCitaId);

        Cita citaOriginal = citaRepository.findById(citaOriginalId).orElseThrow();
        assertEquals("reprogramada", citaOriginal.getEstado());

        CupoDiario c1 = cupoDiarioRepository.findById(cupo1.getId()).orElseThrow();
        CupoDiario c2 = cupoDiarioRepository.findById(cupo2.getId()).orElseThrow();
        assertEquals(0, c1.getCuposOcupados(), "El cupo de la cita original debe quedar liberado en 0");
        assertEquals(1, c2.getCuposOcupados(), "El nuevo cupo debe tener 1 cupo ocupado");

        List<CitaEstadoHistorial> histCita1 = historialRepository.findByCitaIdOrderByFechaCambioDesc(citaOriginalId);
        assertEquals(2, histCita1.size());
        assertEquals("reprogramada", histCita1.get(0).getEstadoNuevo());
        assertEquals("pendiente", histCita1.get(0).getEstadoAnterior());
    }

    @Test
    @DisplayName("Cancelar Cita: Libera cupo atómicamente y audita motivo")
    void testCancelarCitaLiberaCupo() throws Exception {
        CrearCitaRequestDTO agendarReq = CrearCitaRequestDTO.builder()
                .pacienteId(paciente.getId())
                .cupoDiarioId(cupo1.getId())
                .usuarioId(usuario.getId())
                .build();

        String agendarResp = mockMvc.perform(post("/citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(agendarReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long citaId = objectMapper.readTree(agendarResp).get("data").get("id").asLong();

        CancelarCitaRequestDTO cancelReq = CancelarCitaRequestDTO.builder()
                .usuarioId(usuario.getId())
                .motivo("Cancelación por orden médica previa")
                .build();

        mockMvc.perform(post("/citas/" + citaId + "/cancelar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("cancelada"));

        Cita citaCancelada = citaRepository.findById(citaId).orElseThrow();
        assertEquals("cancelada", citaCancelada.getEstado());

        CupoDiario cupo = cupoDiarioRepository.findById(cupo1.getId()).orElseThrow();
        assertEquals(0, cupo.getCuposOcupados(), "El cupo debe liberarse tras la cancelación");
    }

    @Test
    @DisplayName("Tolerancia a citas en papel migradas: Citas sin horaEstimada operan sin error")
    void testCitaSinHoraEstimadaMigradaDePapel() throws Exception {
        Cita citaPapel = citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo1)
                .horaEstimada(null)
                .horaVentanaInicio(null)
                .horaVentanaFin(null)
                .estado("pendiente")
                .registradoPor(usuario)
                .build());

        mockMvc.perform(get("/citas/" + citaPapel.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(citaPapel.getId()))
                .andExpect(jsonPath("$.data.horaEstimada").doesNotExist())
                .andExpect(jsonPath("$.data.estado").value("pendiente"));
    }

    @Test
    @DisplayName("Cierre Diario de Citas: Función atómica de BD marca inasistencias y genera auditoría sin liberar cupo")
    void testCierreDiarioCitasAtomicsSp() throws Exception {
        CrearCitaRequestDTO req = CrearCitaRequestDTO.builder()
                .pacienteId(paciente.getId())
                .cupoDiarioId(cupo1.getId())
                .usuarioId(usuario.getId())
                .build();

        String agendarResp = mockMvc.perform(post("/citas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long citaId = objectMapper.readTree(agendarResp).get("data").get("id").asLong();

        CierreDiarioRequestDTO cierreReq = CierreDiarioRequestDTO.builder()
                .fecha(cupo1.getFecha())
                .subespecialidadId(subespecialidad.getId())
                .usuarioId(usuario.getId())
                .build();

        mockMvc.perform(post("/citas/cierre-diario")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cierreReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(1));

        Cita citaFinal = citaRepository.findById(citaId).orElseThrow();
        assertEquals("no_asistio", citaFinal.getEstado());

        CupoDiario cupoFinal = cupoDiarioRepository.findById(cupo1.getId()).orElseThrow();
        assertEquals(1, cupoFinal.getCuposOcupados(), "El cupo de la jornada no debe liberarse en el cierre diario");

        List<CitaEstadoHistorial> hist = historialRepository.findByCitaIdOrderByFechaCambioDesc(citaId);
        assertFalse(hist.isEmpty());
        assertEquals("no_asistio", hist.get(0).getEstadoNuevo());
    }

    @Test
    @DisplayName("Regla Clínica BD (Trigger): Previene alteración de cita en estado terminal")
    void testTriggerPrevenirModificacionCitaTerminal() {
        Cita citaTerminal = citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo1)
                .estado("atendida")
                .registradoPor(usuario)
                .build());

        citaTerminal.setEstado("pendiente");
        assertThrows(Exception.class, () -> citaRepository.saveAndFlush(citaTerminal),
                "El trigger de PostgreSQL debe impedir reactivar una cita en estado terminal");
    }
}
