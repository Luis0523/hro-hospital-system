package com.hro.system.turnoestacion.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteCiclo;
import com.hro.system.archivo.entity.UbicacionArchivo;
import com.hro.system.archivo.repository.ExpedienteCicloRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.archivo.repository.UbicacionArchivoRepository;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.estacion.entity.EstacionEnfermeria;
import com.hro.system.estacion.entity.EstacionSubespecialidad;
import com.hro.system.estacion.repository.EstacionEnfermeriaRepository;
import com.hro.system.estacion.repository.EstacionSubespecialidadRepository;
import com.hro.system.medico.entity.Medico;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.paciente.repository.PacienteRepository;
import com.hro.system.turnoestacion.repository.TurnoEstacionRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test-postgres")
@AutoConfigureMockMvc
@Transactional
class TurnoEstacionCircuitoTest {

    private static final ZoneId GT = ZoneId.of("America/Guatemala");
    private static final LocalDate HOY = LocalDate.now(GT);

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TurnoEstacionRepository turnoRepository;
    @Autowired private ExpedienteCicloRepository expedienteCicloRepository;
    @Autowired private ExpedienteRepository expedienteRepository;
    @Autowired private UbicacionArchivoRepository ubicacionArchivoRepository;
    @Autowired private EstacionEnfermeriaRepository estacionRepository;
    @Autowired private EstacionSubespecialidadRepository estacionSubespecialidadRepository;
    @Autowired private EspecialidadRepository especialidadRepository;
    @Autowired private SubespecialidadRepository subespecialidadRepository;
    @Autowired private EspacioFisicoRepository espacioFisicoRepository;
    @Autowired private AsignacionDiariaEspacioRepository asignacionDiariaEspacioRepository;
    @Autowired private MedicoRepository medicoRepository;
    @Autowired private PacienteRepository pacienteRepository;
    @Autowired private UsuarioReferenciaRepository usuarioRepository;

    private record Contexto(
            EstacionEnfermeria estacion,
            Especialidad especialidad,
            Subespecialidad subespecialidad,
            EspacioFisico espacio,
            Medico medico,
            Paciente paciente,
            Expediente expediente,
            UbicacionArchivo ubicacion,
            UsuarioReferencia setup) {
    }

    private Contexto crearContexto(Integer correlativoMax) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        UsuarioReferencia setup = usuarioRepository.findByIdExterno("setup-turno-" + suffix)
                .orElseGet(() -> usuarioRepository.save(UsuarioReferencia.builder()
                        .idExterno("setup-turno-" + suffix)
                        .nombreMostrar("Setup " + suffix)
                        .activo(true)
                        .build()));

        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Medicina Interna " + suffix)
                .abreviatura("MI")
                .correlativoMax(correlativoMax)
                .activo(true)
                .build());

        Subespecialidad subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Consulta " + suffix)
                .activo(true)
                .build());

        EstacionEnfermeria estacion = estacionRepository.save(EstacionEnfermeria.builder()
                .codigo("EST-" + suffix)
                .nombre("Estación " + suffix)
                .activo(true)
                .build());

        estacionSubespecialidadRepository.save(EstacionSubespecialidad.builder()
                .estacion(estacion)
                .subespecialidad(subespecialidad)
                .activo(true)
                .build());

        EspacioFisico espacio = espacioFisicoRepository.save(EspacioFisico.builder()
                .numero("C-" + suffix)
                .nivel((short) 1)
                .nombre("Consultorio " + suffix)
                .activo(true)
                .build());

        asignacionDiariaEspacioRepository.save(AsignacionDiariaEspacio.builder()
                .espacioFisico(espacio)
                .subespecialidad(subespecialidad)
                .fecha(HOY)
                .creadoPor(setup)
                .build());

        Medico medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. " + suffix)
                .numeroColegiado("COL-" + suffix)
                .activo(true)
                .build());

        Paciente paciente = pacienteRepository.save(Paciente.builder()
                .dpi("DPI" + suffix)
                .nombres("Paciente")
                .apellidos(suffix)
                .fechaNacimiento(LocalDate.of(1990, 1, 1))
                .sexo("M")
                .numeroExpediente("EXP-" + suffix)
                .build());

        UbicacionArchivo ubicacion = ubicacionArchivoRepository.save(UbicacionArchivo.builder()
                .pasillo("P" + suffix)
                .estante("E1")
                .balda("B1")
                .descripcion("Archivo de prueba " + suffix)
                .build());

        Expediente expediente = expedienteRepository.save(Expediente.builder()
                .paciente(paciente)
                .numeroExpediente(paciente.getNumeroExpediente())
                .ubicacionBase(ubicacion)
                .activo(true)
                .depurado(false)
                .build());

        return new Contexto(estacion, especialidad, subespecialidad, espacio, medico,
                paciente, expediente, ubicacion, setup);
    }

    private Especialidad agregarEspecialidad(Contexto contexto, String abreviatura, Integer max) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Especialidad especialidad = especialidadRepository.save(Especialidad.builder()
                .nombre("Especialidad " + abreviatura + " " + suffix)
                .abreviatura(abreviatura)
                .correlativoMax(max)
                .activo(true)
                .build());
        Subespecialidad subespecialidad = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(especialidad)
                .nombre("Sub " + suffix)
                .activo(true)
                .build());
        estacionSubespecialidadRepository.save(EstacionSubespecialidad.builder()
                .estacion(contexto.estacion())
                .subespecialidad(subespecialidad)
                .activo(true)
                .build());
        return especialidad;
    }

    private MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder builder,
                                               String rol, String usuario, Long estacionId) {
        return builder
                .header("X-Usuario-Id", usuario)
                .header("X-Usuario-Rol", rol)
                .header("X-Usuario-Nombre", "Usuario " + rol)
                .header("X-Estacion-Id", String.valueOf(estacionId));
    }

    private JsonNode crearTurno(Contexto contexto, Long especialidadId, String usuario) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("estacionId", contexto.estacion().getId());
        body.put("especialidadId", especialidadId);
        body.put("fecha", HOY.toString());

        String respuesta = mockMvc.perform(auth(post("/turnos-estacion"), "enfermeria", usuario,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(respuesta).get("data");
    }

    @Test
    @DisplayName("Circuito completo: registrar, recibir, enviar a clínica, vincular expediente, llamar, atender, devolver y archivar")
    void circuitoCompleto() throws Exception {
        Contexto contexto = crearContexto(null);
        String enfermeria = "enf-" + UUID.randomUUID().toString().substring(0, 8);
        String medico = "med-" + UUID.randomUUID().toString().substring(0, 8);
        String archivo = "arch-" + UUID.randomUUID().toString().substring(0, 8);

        JsonNode turno = crearTurno(contexto, contexto.especialidad().getId(), enfermeria);
        UUID turnoId = UUID.fromString(turno.get("id").asText());
        assertThat(turno.get("estado").asText()).isEqualTo("registrado");
        assertThat(turno.get("numeroGeneral").asInt()).isEqualTo(1);
        assertThat(turno.get("correlativoEspecialidad").asInt()).isEqualTo(1);
        assertThat(turno.get("codigo").asText()).isEqualTo("MI1");

        mockMvc.perform(auth(get("/espacios-fisicos/numero/" + contexto.espacio().getNumero()),
                        "enfermeria", enfermeria, contexto.estacion().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(contexto.espacio().getId().toString()));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/recibir"), "enfermeria", enfermeria,
                        contexto.estacion().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("recibido"));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/asignar-clinica"),
                        "enfermeria", enfermeria, contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "espacioFisicoId", contexto.espacio().getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("en_clinica"))
                .andExpect(jsonPath("$.data.espacioFisicoNumero").value(contexto.espacio().getNumero()));

        String vinculado = mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/vincular-expediente"),
                        "medico", medico, contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "numeroColegiado", contexto.medico().getNumeroColegiado(),
                                "espacioFisicoId", contexto.espacio().getId().toString(),
                                "numeroExpediente", contexto.expediente().getNumeroExpediente()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.numeroExpediente").value(contexto.expediente().getNumeroExpediente()))
                .andExpect(jsonPath("$.data.pacienteId").value(contexto.paciente().getId().toString()))
                .andReturn().getResponse().getContentAsString();

        JsonNode dataVinculado = objectMapper.readTree(vinculado).get("data");
        UUID cicloId = UUID.fromString(dataVinculado.get("expedienteCicloId").asText());

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/llamar"), "medico", medico,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "numeroColegiado", contexto.medico().getNumeroColegiado(),
                                "espacioFisicoId", contexto.espacio().getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("llamado"))
                .andExpect(jsonPath("$.data.llamados").value(1));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/atendido"), "medico", medico,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "numeroColegiado", contexto.medico().getNumeroColegiado(),
                                "espacioFisicoId", contexto.espacio().getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("atendido"));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/devolver"), "enfermeria", enfermeria,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"observacion\":\"Expediente devuelto\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("devuelto"));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/archivar"), "archivo", archivo,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "ubicacionDestinoId", contexto.ubicacion().getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("archivado"))
                .andExpect(jsonPath("$.data.archivadoEn").isNotEmpty());

        ExpedienteCiclo ciclo = expedienteCicloRepository.findById(cicloId).orElseThrow();
        assertThat(ciclo.getEstadoActual()).isEqualTo("archivado");

        mockMvc.perform(auth(get("/turnos-estacion/" + turnoId), "enfermeria", enfermeria,
                        contexto.estacion().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("archivado"))
                .andExpect(jsonPath("$.data.movimientos.length()").value(8));

        mockMvc.perform(auth(get("/turnos-estacion/libro"), "enfermeria", enfermeria,
                        contexto.estacion().getId())
                        .param("fecha", HOY.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.especialidades[0].registrados").value(1))
                .andExpect(jsonPath("$.data.especialidades[0].turnos[0].codigo").value("MI1"))
                .andExpect(jsonPath("$.data.resumen.archivado").value(1));
    }

    @Test
    @DisplayName("Registra con clínica y permite cambiarla antes de En clínica")
    void registraConClinicaYCambiaAntesDeEnClinica() throws Exception {
        Contexto contexto = crearContexto(null);
        String usuario = "enf-" + UUID.randomUUID().toString().substring(0, 8);
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        EspacioFisico otraClinica = espacioFisicoRepository.save(EspacioFisico.builder()
                .numero("C2-" + suffix)
                .nivel((short) 1)
                .nombre("Consultorio alterno " + suffix)
                .activo(true)
                .build());
        asignacionDiariaEspacioRepository.save(AsignacionDiariaEspacio.builder()
                .espacioFisico(otraClinica)
                .subespecialidad(contexto.subespecialidad())
                .fecha(HOY)
                .creadoPor(contexto.setup())
                .build());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("estacionId", contexto.estacion().getId());
        body.put("especialidadId", contexto.especialidad().getId());
        body.put("fecha", HOY.toString());
        body.put("espacioFisicoId", contexto.espacio().getId().toString());

        String creado = mockMvc.perform(auth(post("/turnos-estacion"), "enfermeria", usuario,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.estado").value("registrado"))
                .andExpect(jsonPath("$.data.espacioFisicoId").value(contexto.espacio().getId().toString()))
                .andReturn().getResponse().getContentAsString();
        UUID turnoId = UUID.fromString(objectMapper.readTree(creado).get("data").get("id").asText());

        mockMvc.perform(auth(put("/turnos-estacion/" + turnoId + "/clinica"),
                        "enfermeria", usuario, contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "espacioFisicoId", otraClinica.getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("registrado"))
                .andExpect(jsonPath("$.data.espacioFisicoId").value(otraClinica.getId().toString()));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/recibir"), "enfermeria", usuario,
                        contexto.estacion().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("recibido"))
                .andExpect(jsonPath("$.data.espacioFisicoId").value(otraClinica.getId().toString()));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/asignar-clinica"),
                        "enfermeria", usuario, contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "espacioFisicoId", otraClinica.getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("en_clinica"));

        mockMvc.perform(auth(put("/turnos-estacion/" + turnoId + "/clinica"),
                        "enfermeria", usuario, contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "espacioFisicoId", contexto.espacio().getId().toString()))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Revierte el último estado y deja el movimiento en la bitácora")
    void revierteUltimoEstado() throws Exception {
        Contexto contexto = crearContexto(null);
        String usuario = "enf-" + UUID.randomUUID().toString().substring(0, 8);

        JsonNode turno = crearTurno(contexto, contexto.especialidad().getId(), usuario);
        UUID turnoId = UUID.fromString(turno.get("id").asText());

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/recibir"), "enfermeria", usuario,
                        contexto.estacion().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("recibido"));

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/revertir"), "enfermeria", usuario,
                        contexto.estacion().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.estado").value("registrado"));

        mockMvc.perform(auth(get("/turnos-estacion/" + turnoId), "enfermeria", usuario,
                        contexto.estacion().getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.movimientos[?(@.estadoNuevo == 'registrado')]").exists());
    }

    @Test
    @DisplayName("Al agotarse el tope de la especialidad responde 409 y no consume el número general")
    void topeCorrelativoNoConsumeNumeroGeneral() throws Exception {
        Contexto contexto = crearContexto(1);
        String usuario = "enf-" + UUID.randomUUID().toString().substring(0, 8);
        Especialidad otra = agregarEspecialidad(contexto, "P", null);

        JsonNode primero = crearTurno(contexto, contexto.especialidad().getId(), usuario);
        assertThat(primero.get("numeroGeneral").asInt()).isEqualTo(1);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("estacionId", contexto.estacion().getId());
        body.put("especialidadId", contexto.especialidad().getId());
        body.put("fecha", HOY.toString());

        mockMvc.perform(auth(post("/turnos-estacion"), "enfermeria", usuario,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict());

        JsonNode segundo = crearTurno(contexto, otra.getId(), usuario);
        assertThat(segundo.get("numeroGeneral").asInt()).isEqualTo(2);
        assertThat(segundo.get("codigo").asText()).isEqualTo("P1");
    }

    @Test
    @DisplayName("Borrado lógico del turno intermedio no reutiliza números; el último se borra físicamente y decrementa contadores")
    void borradoYContadores() throws Exception {
        Contexto contexto = crearContexto(null);
        String usuario = "enf-" + UUID.randomUUID().toString().substring(0, 8);

        JsonNode t1 = crearTurno(contexto, contexto.especialidad().getId(), usuario);
        JsonNode t2 = crearTurno(contexto, contexto.especialidad().getId(), usuario);
        JsonNode t3 = crearTurno(contexto, contexto.especialidad().getId(), usuario);
        assertThat(t1.get("numeroGeneral").asInt()).isEqualTo(1);
        assertThat(t2.get("numeroGeneral").asInt()).isEqualTo(2);
        assertThat(t3.get("numeroGeneral").asInt()).isEqualTo(3);

        UUID id2 = UUID.fromString(t2.get("id").asText());
        mockMvc.perform(auth(delete("/turnos-estacion/" + id2), "enfermeria", usuario,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivo\":\"Registro duplicado\"}"))
                .andExpect(status().isOk());

        assertThat(turnoRepository.findById(id2).orElseThrow().getActivo()).isFalse();

        mockMvc.perform(auth(get("/turnos-estacion/" + id2), "enfermeria", usuario,
                        contexto.estacion().getId()))
                .andExpect(status().isNotFound());

        JsonNode t4 = crearTurno(contexto, contexto.especialidad().getId(), usuario);
        assertThat(t4.get("numeroGeneral").asInt()).isEqualTo(4);
        assertThat(t4.get("correlativoEspecialidad").asInt()).isEqualTo(4);

        UUID id4 = UUID.fromString(t4.get("id").asText());
        mockMvc.perform(auth(delete("/turnos-estacion/" + id4), "enfermeria", usuario,
                        contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivo\":\"Error de captura\"}"))
                .andExpect(status().isOk());

        assertThat(turnoRepository.findById(id4)).isEmpty();

        JsonNode t5 = crearTurno(contexto, contexto.especialidad().getId(), usuario);
        assertThat(t5.get("numeroGeneral").asInt()).isEqualTo(4);
        assertThat(t5.get("correlativoEspecialidad").asInt()).isEqualTo(4);
    }

    @Test
    @DisplayName("Resumen de clínicas: registra y deshace devoluciones sin identificar el turno")
    void resumenYDevolucionesPorClinica() throws Exception {
        Contexto contexto = crearContexto(null);
        String enfermeria = "enf-" + UUID.randomUUID().toString().substring(0, 8);

        JsonNode turno = crearTurno(contexto, contexto.especialidad().getId(), enfermeria);
        UUID turnoId = UUID.fromString(turno.get("id").asText());

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/recibir"), "enfermeria", enfermeria,
                        contexto.estacion().getId()))
                .andExpect(status().isOk());
        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/asignar-clinica"),
                        "enfermeria", enfermeria, contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "espacioFisicoId", contexto.espacio().getId().toString()))))
                .andExpect(status().isOk());

        mockMvc.perform(auth(get("/turnos-estacion/clinicas/resumen"), "enfermeria", enfermeria,
                        contexto.estacion().getId())
                        .param("fecha", HOY.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.espacioFisicoId == '" + contexto.espacio().getId()
                        + "')].asignados").value(1))
                .andExpect(jsonPath("$.data[?(@.espacioFisicoId == '" + contexto.espacio().getId()
                        + "')].devueltos").value(0))
                .andExpect(jsonPath("$.data[?(@.espacioFisicoId == '" + contexto.espacio().getId()
                        + "')].pendientes").value(1));

        mockMvc.perform(auth(post("/turnos-estacion/clinicas/" + contexto.espacio().getId()
                        + "/devoluciones"), "enfermeria", enfermeria, contexto.estacion().getId())
                        .param("fecha", HOY.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.devueltos").value(1))
                .andExpect(jsonPath("$.data.pendientes").value(0));

        mockMvc.perform(auth(post("/turnos-estacion/clinicas/" + contexto.espacio().getId()
                        + "/devoluciones/deshacer"), "enfermeria", enfermeria,
                        contexto.estacion().getId())
                        .param("fecha", HOY.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.devueltos").value(0))
                .andExpect(jsonPath("$.data.pendientes").value(1));
    }

    @Test
    @DisplayName("No se puede vincular expediente antes de enviar el turno a la clínica")
    void vinculacionRequiereClinica() throws Exception {
        Contexto contexto = crearContexto(null);
        String enfermeria = "enf-" + UUID.randomUUID().toString().substring(0, 8);
        String medico = "med-" + UUID.randomUUID().toString().substring(0, 8);

        JsonNode turno = crearTurno(contexto, contexto.especialidad().getId(), enfermeria);
        UUID turnoId = UUID.fromString(turno.get("id").asText());

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/recibir"), "enfermeria", enfermeria,
                        contexto.estacion().getId()))
                .andExpect(status().isOk());

        mockMvc.perform(auth(post("/turnos-estacion/" + turnoId + "/vincular-expediente"),
                        "medico", medico, contexto.estacion().getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "numeroColegiado", contexto.medico().getNumeroColegiado(),
                                "espacioFisicoId", contexto.espacio().getId().toString(),
                                "numeroExpediente", contexto.expediente().getNumeroExpediente()))))
                .andExpect(status().isConflict());
    }
}
