package com.hro.system.turno.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.turno.dto.GenerarTurnoRequestDTO;
import com.hro.system.turno.entity.Turno;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TurnoBalanceoTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private EspecialidadRepository especialidadRepository;
    @Autowired private SubespecialidadRepository subespecialidadRepository;
    @Autowired private SubespecialidadHorarioRepository horarioRepository;
    @Autowired private EspacioFisicoRepository espacioRepository;
    @Autowired private AsignacionDiariaEspacioRepository asignacionRepository;
    @Autowired private PacienteRepository pacienteRepository;
    @Autowired private UsuarioReferenciaRepository usuarioRepository;
    @Autowired private CupoDiarioRepository cupoDiarioRepository;
    @Autowired private CitaRepository citaRepository;
    @Autowired private TurnoRepository turnoRepository;

    private Cita cita1;
    private Cita cita2;

    @BeforeEach
    void setUp() {
        LocalDate fecha = LocalDate.now();
        short dia = (short) fecha.getDayOfWeek().getValue();

        Especialidad esp = especialidadRepository.save(Especialidad.builder().nombre("Pediatría " + System.nanoTime()).activo(true).build());
        Subespecialidad sub = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(esp).nombre("Pediatría General").activo(true).build());
        SubespecialidadHorario horario = horarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(sub).diaSemana(dia)
                .horaInicio(LocalTime.of(7, 0)).horaFin(LocalTime.of(13, 0))
                .capacidadMaxima(10).duracionConsultaMinutos(30).activo(true).build());

        UsuarioReferencia usuario = usuarioRepository.save(UsuarioReferencia.builder()
                .idExterno("enf-bal-" + System.nanoTime()).nombreMostrar("Enfermería")
                .rolPrincipal("enfermeria").activo(true).build());

        EspacioFisico e1 = espacioRepository.save(EspacioFisico.builder().numero("B1-" + System.nanoTime()).nivel((short) 1)
                .capacidadCamillas(1).nombre("Sala B1").activo(true).build());
        EspacioFisico e2 = espacioRepository.save(EspacioFisico.builder().numero("B2-" + System.nanoTime()).nivel((short) 1)
                .capacidadCamillas(1).nombre("Sala B2").activo(true).build());

        asignacionRepository.save(AsignacionDiariaEspacio.builder().espacioFisico(e1).subespecialidad(sub).fecha(fecha).creadoPor(usuario).build());
        asignacionRepository.save(AsignacionDiariaEspacio.builder().espacioFisico(e2).subespecialidad(sub).fecha(fecha).creadoPor(usuario).build());

        CupoDiario cupo = cupoDiarioRepository.save(CupoDiario.builder()
                .subespecialidadHorario(horario).fecha(fecha).capacidadMaxima(10).cuposOcupados(2).build());

        Paciente p1 = pacienteRepository.save(Paciente.builder().dpi("1" + System.nanoTime()).nombres("Ana").apellidos("Uno")
                .fechaNacimiento(LocalDate.of(1990, 1, 1)).sexo("F").build());
        Paciente p2 = pacienteRepository.save(Paciente.builder().dpi("2" + System.nanoTime()).nombres("Beto").apellidos("Dos")
                .fechaNacimiento(LocalDate.of(1991, 1, 1)).sexo("M").build());

        cita1 = citaRepository.save(Cita.builder().paciente(p1).cupoDiario(cupo).estado("pendiente").registradoPor(usuario).build());
        cita2 = citaRepository.save(Cita.builder().paciente(p2).cupoDiario(cupo).estado("pendiente").registradoPor(usuario).build());
    }

    @Test
    @DisplayName("Check-in con 2 salas de la misma subespecialidad: balancea, numera global y permite reasignar")
    void balanceoNumeracionYReasignacion() throws Exception {
        Turno t1 = checkIn(cita1);
        Turno t2 = checkIn(cita2);

        long a1 = t1.getAsignacionDiariaEspacio().getId();
        long a2 = t2.getAsignacionDiariaEspacio().getId();
        assertNotEquals(a1, a2, "El balanceo debe repartir en salas distintas");
        assertEquals(t1.getNumeroTurno() + 1, t2.getNumeroTurno(), "La numeracion debe ser global y consecutiva");

        // Reasignar el turno 1 a la sala del turno 2
        AsignacionDiariaEspacio otraAsignacion = t2.getAsignacionDiariaEspacio();
        mockMvc.perform(patch("/turnos/{id}/sala", t1.getId())
                        .param("nuevoEspacioFisicoId", otraAsignacion.getEspacioFisico().getId().toString())
                        .param("motivo", "Sala desocupada"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.asignacionDiariaEspacioId").value(a2));

        Turno recargado = turnoRepository.findById(t1.getId()).orElseThrow();
        assertEquals(a2, recargado.getAsignacionDiariaEspacio().getId());
    }

    private Turno checkIn(Cita cita) throws Exception {
        String body = objectMapper.writeValueAsString(GenerarTurnoRequestDTO.builder()
                .citaId(cita.getId()).usuarioId(cita.getRegistradoPor().getId()).build());
        String resp = mockMvc.perform(post("/turnos/check-in")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(resp).path("data").path("id").asLong();
        return turnoRepository.findById(id).orElseThrow();
    }
}
