package com.hro.system.archivo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.archivo.dto.CrearExpedienteRequestDTO;
import com.hro.system.archivo.dto.CrearUbicacionArchivoRequestDTO;
import com.hro.system.archivo.dto.IniciarCicloRequestDTO;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteMovimientoRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.archivo.repository.UbicacionArchivoRepository;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.entity.CitaEstadoHistorial;
import com.hro.system.cita.repository.CitaEstadoHistorialRepository;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ArchivoCicloTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private ExpedienteCicloRepository expedienteCicloRepository;

    @Autowired
    private ExpedienteMovimientoRepository expedienteMovimientoRepository;

    @Autowired
    private UbicacionArchivoRepository ubicacionArchivoRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private CitaEstadoHistorialRepository citaEstadoHistorialRepository;

    @Autowired
    private TurnoRepository turnoRepository;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private MedicoSubespecialidadRepository medicoSubespecialidadRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioReferenciaRepository;

    private UsuarioReferencia usuario;
    private Paciente paciente;
    private Cita cita;

    @BeforeEach
    void setUp() {
        expedienteMovimientoRepository.deleteAllInBatch();
        expedienteCicloRepository.deleteAllInBatch();
        expedienteRepository.deleteAllInBatch();
        ubicacionArchivoRepository.deleteAllInBatch();
        turnoRepository.deleteAllInBatch();
        citaEstadoHistorialRepository.deleteAllInBatch();
        citaRepository.deleteAllInBatch();
        cupoDiarioRepository.deleteAllInBatch();
        medicoSubespecialidadRepository.deleteAllInBatch();

        String suffix = UUID.randomUUID().toString().substring(0, 5);

        usuario = usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                .idExterno("archivo-" + suffix)
                .nombreMostrar("Operador Archivo " + suffix)
                .rolPrincipal("archivo")
                .activo(true)
                .build());

        paciente = pacienteRepository.save(Paciente.builder()
                .dpi("DPI-ARCH-" + suffix)
                .nombres("Ana " + suffix)
                .apellidos("Morales")
                .fechaNacimiento(LocalDate.of(1985, 3, 20))
                .sexo("F")
                .numeroExpediente("EXP-ARCH-" + suffix)
                .build());

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Consulta Externa " + suffix)
                .activo(true)
                .build());

        Subespecialidad subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Medicina General " + suffix)
                .activo(true)
                .build());

        Medico medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. Archivo Test")
                .numeroColegiado("COL-ARCH-" + suffix)
                .usuarioReferencia(usuario)
                .activo(true)
                .build());

        MedicoSubespecialidad medicoSubespecialidad = medicoSubespecialidadRepository.save(MedicoSubespecialidad.builder()
                .medico(medico)
                .subespecialidad(subespecialidad)
                .diaSemana((short) 1)
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(10)
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());

        CupoDiario cupo = cupoDiarioRepository.save(CupoDiario.builder()
                .medicoSubespecialidad(medicoSubespecialidad)
                .fecha(LocalDate.of(2026, 9, 14))
                .capacidadMaxima(10)
                .cuposOcupados(1)
                .build());

        cita = citaRepository.save(Cita.builder()
                .paciente(paciente)
                .cupoDiario(cupo)
                .estado("confirmada")
                .registradoPor(usuario)
                .build());
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder builder) {
        return builder
                .header("X-Usuario-Id", usuario.getIdExterno())
                .header("X-Usuario-Rol", "archivo")
                .header("X-Usuario-Nombre", usuario.getNombreMostrar());
    }

    private Long crearUbicacion(String pasillo, String estante, String balda) throws Exception {
        CrearUbicacionArchivoRequestDTO dto = CrearUbicacionArchivoRequestDTO.builder()
                .pasillo(pasillo).estante(estante).balda(balda).build();

        String resp = mockMvc.perform(auth(post("/ubicaciones-archivo"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(resp).get("data").get("id").asLong();
    }

    private UUID crearExpediente(Long ubicacionBaseId) throws Exception {
        CrearExpedienteRequestDTO dto = CrearExpedienteRequestDTO.builder()
                .pacienteId(paciente.getId())
                .ubicacionBaseId(ubicacionBaseId)
                .build();

        String resp = mockMvc.perform(auth(post("/expedientes"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(resp).get("data").get("id").asText());
    }

    private UUID iniciarCiclo(UUID expedienteId) throws Exception {
        IniciarCicloRequestDTO dto = IniciarCicloRequestDTO.builder()
                .expedienteId(expedienteId)
                .citaId(cita.getId())
                .build();

        String resp = mockMvc.perform(auth(post("/expediente-ciclos"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(resp).get("data").get("id").asText());
    }

    private void transicion(UUID cicloId, String accion, String body, String estadoEsperado) throws Exception {
        MockHttpServletRequestBuilder builder = auth(post("/expediente-ciclos/" + cicloId + "/" + accion));
        if (body != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        mockMvc.perform(builder)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.estadoActual").value(estadoEsperado));
    }

    @Test
    @DisplayName("Flujo completo: crear expediente, iniciar ciclo y recorrer las 7 transiciones hasta archivar")
    void testFlujoCompletoExpediente() throws Exception {
        Long ubicacionId = crearUbicacion("B", "14", "3");
        UUID expedienteId = crearExpediente(ubicacionId);
        UUID cicloId = iniciarCiclo(expedienteId);

        transicion(cicloId, "iniciar-busqueda", "{\"observacion\":\"Buscar en estantería B\"}", "en_busqueda");
        transicion(cicloId, "localizar", "{\"observacion\":\"Encontrado\"}", "localizado");
        transicion(cicloId, "despachar", "{\"ubicacionDestinoId\":" + ubicacionId + "}", "en_transito_entrega");
        transicion(cicloId, "entregar", "{\"observacion\":\"Recibido por enfermería\"}", "entregado");
        transicion(cicloId, "retornar", "{\"observacion\":\"Consulta finalizada\"}", "en_transito_retorno");
        transicion(cicloId, "archivar", null, "archivado");

        mockMvc.perform(auth(get("/expediente-ciclos/" + cicloId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estadoActual").value("archivado"))
                .andExpect(jsonPath("$.data.movimientos.length()").value(7))
                .andExpect(jsonPath("$.data.numeroExpediente").value(paciente.getNumeroExpediente()))
                .andExpect(jsonPath("$.data.paciente.apellidos").value("Morales"));

        ExpedienteCiclo ciclo = expedienteCicloRepository.findById(cicloId).orElseThrow();
        assertEquals("archivado", ciclo.getEstadoActual());
        assertEquals(6, ciclo.getVersion(), "La versión debe incrementarse una vez por transición");
        assertEquals(7, expedienteMovimientoRepository.findByExpedienteCicloIdOrderByFechaMovimientoAscIdAsc(cicloId).size());
    }

    @Test
    @DisplayName("Ciclo duplicado para la misma cita responde 409")
    void testCicloDuplicadoDevuelve409() throws Exception {
        Long ubicacionId = crearUbicacion("C", "1", "1");
        UUID expedienteId = crearExpediente(ubicacionId);
        iniciarCiclo(expedienteId);

        IniciarCicloRequestDTO dto = IniciarCicloRequestDTO.builder()
                .expedienteId(expedienteId)
                .citaId(cita.getId())
                .build();

        mockMvc.perform(auth(post("/expediente-ciclos"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Transición inválida (archivar sin retorno) responde 400")
    void testTransicionInvalidaDevuelve400() throws Exception {
        Long ubicacionId = crearUbicacion("D", "2", "2");
        UUID expedienteId = crearExpediente(ubicacionId);
        UUID cicloId = iniciarCiclo(expedienteId);

        mockMvc.perform(auth(post("/expediente-ciclos/" + cicloId + "/archivar"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("No localizado exige observación y permite reintentar la búsqueda")
    void testNoLocalizadoYReintento() throws Exception {
        Long ubicacionId = crearUbicacion("E", "5", "9");
        UUID expedienteId = crearExpediente(ubicacionId);
        UUID cicloId = iniciarCiclo(expedienteId);

        transicion(cicloId, "iniciar-busqueda", null, "en_busqueda");

        mockMvc.perform(auth(post("/expediente-ciclos/" + cicloId + "/no-localizado"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        transicion(cicloId, "no-localizado", "{\"observacion\":\"No estaba en su casillero\"}", "no_localizado");
        transicion(cicloId, "reintentar-busqueda", "{\"observacion\":\"Apareció en préstamo\"}", "en_busqueda");

        ExpedienteCiclo ciclo = expedienteCicloRepository.findById(cicloId).orElseThrow();
        assertEquals("en_busqueda", ciclo.getEstadoActual());
    }

    @Test
    @DisplayName("Búsqueda de expedientes por número y por paciente")
    void testBusquedaDeExpedientes() throws Exception {
        Long ubicacionId = crearUbicacion("F", "8", "4");
        UUID expedienteId = crearExpediente(ubicacionId);

        mockMvc.perform(auth(get("/expedientes/numero/" + paciente.getNumeroExpediente())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(expedienteId.toString()));

        mockMvc.perform(auth(get("/expedientes/paciente/" + paciente.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.numeroExpediente").value(paciente.getNumeroExpediente()));

        mockMvc.perform(auth(get("/expedientes/buscar").param("filtro", paciente.getNumeroExpediente())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(expedienteId.toString()));

        Expediente expediente = expedienteRepository.findById(expedienteId).orElseThrow();
        assertEquals(paciente.getNumeroExpediente(), expediente.getNumeroExpediente());
        assertEquals(ubicacionId, expediente.getUbicacionBase().getId());
    }
}
