package com.hro.system.turno.service;

import com.hro.system.agenda.config.HroAgendaProperties;
import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.cita.entity.Cita;
import com.hro.system.cita.repository.CitaEstadoHistorialRepository;
import com.hro.system.cita.repository.CitaRepository;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.espacio.entity.AsignacionDiariaEspacio;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.AsignacionDiariaEspacioRepository;
import com.hro.system.medico.entity.Medico;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.turno.dto.GenerarTurnoRequestDTO;
import com.hro.system.turno.dto.ReintegrarTurnoRequestDTO;
import com.hro.system.turno.dto.TableroTurnoDTO;
import com.hro.system.turno.entity.ContadorTurnoDiario;
import com.hro.system.turno.entity.Turno;
import com.hro.system.turno.repository.ContadorTurnoDiarioRepository;
import com.hro.system.turno.repository.TurnoRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.converter.MessageConverter;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.support.MessageBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifica que el tablero reciba, por WebSocket, el tipo de evento y el intento
 * de llamado correctos, sin necesidad de base de datos ni de un broker real.
 */
class TurnoServiceTableroTest {

    private static final long ASIGNACION_ID = 10L;

    private TurnoRepository turnoRepository;
    private ContadorTurnoDiarioRepository contadorRepository;
    private CitaRepository citaRepository;
    private CitaEstadoHistorialRepository historialRepository;
    private UsuarioReferenciaRepository usuarioRepository;
    private AsignacionDiariaEspacioRepository asignacionRepository;

    private TurnoService service;

    /** Registros de publicación capturados: [destination, payload]. */
    private final List<Object[]> capturados = new ArrayList<>();

    private UsuarioReferencia usuario;
    private AsignacionDiariaEspacio asignacion;
    private ContadorTurnoDiario contador;
    private Cita cita;

    @BeforeEach
    void setUp() {
        turnoRepository = mock(TurnoRepository.class);
        contadorRepository = mock(ContadorTurnoDiarioRepository.class);
        citaRepository = mock(CitaRepository.class);
        historialRepository = mock(CitaEstadoHistorialRepository.class);
        usuarioRepository = mock(UsuarioReferenciaRepository.class);
        asignacionRepository = mock(AsignacionDiariaEspacioRepository.class);

        SimpMessagingTemplate messagingTemplate = new SimpMessagingTemplate(new CanalCapturador());
        MessageConverter conversor = new MessageConverter() {
            @Override
            public Message<?> toMessage(Object payload, MessageHeaders headers) {
                capturados.add(new Object[]{
                        headers.get(SimpMessageHeaderAccessor.DESTINATION_HEADER), payload});
                return MessageBuilder.createMessage(new byte[0], headers);
            }

            @Override
            public Object fromMessage(Message<?> message, Class<?> targetClass) {
                return null;
            }
        };
        messagingTemplate.setMessageConverter(conversor);

        service = new TurnoService(
                turnoRepository,
                contadorRepository,
                citaRepository,
                historialRepository,
                usuarioRepository,
                asignacionRepository,
                new HroAgendaProperties(),
                messagingTemplate,
                mock(ApplicationEventPublisher.class));

        usuario = UsuarioReferencia.builder()
                .id(7L)
                .idExterno("enf-01")
                .nombreMostrar("Enfermera de prueba")
                .rolPrincipal("enfermeria")
                .activo(true)
                .build();

        Subespecialidad subespecialidad = Subespecialidad.builder()
                .id(5L)
                .nombre("Pediatría General")
                .activo(true)
                .build();

        Medico medico = Medico.builder().nombres("Dra. Elena Ramos").build();
        SubespecialidadHorario medicoSubespecialidad = SubespecialidadHorario.builder()
                .subespecialidad(subespecialidad)
                .build();

        CupoDiario cupoDiario = CupoDiario.builder()
                .subespecialidadHorario(medicoSubespecialidad)
                .fecha(LocalDate.now())
                .build();

        EspacioFisico espacio = EspacioFisico.builder()
                .numero("201")
                .nivel((short) 2)
                .nombre("Sala Pediatría")
                .activo(true)
                .build();

        asignacion = AsignacionDiariaEspacio.builder()
                .id(ASIGNACION_ID)
                .espacioFisico(espacio)
                .subespecialidad(subespecialidad)
                .fecha(LocalDate.now())
                .creadoPor(usuario)
                .build();

        contador = ContadorTurnoDiario.builder()
                .id(1L)
                .asignacionDiariaEspacio(asignacion)
                .turnoActual(0)
                .turnoSiguiente(1)
                .build();

        cita = Cita.builder()
                .id(1L)
                .cupoDiario(cupoDiario)
                .estado("confirmada")
                .registradoPor(usuario)
                .build();

        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));
        when(contadorRepository.findByAsignacionDiariaEspacioId(ASIGNACION_ID))
                .thenReturn(Optional.of(contador));
        when(contadorRepository.save(any(ContadorTurnoDiario.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));
    }

    private Turno turnoEn(int numeroTurno, String estado, int intentos) {
        Turno turno = Turno.builder()
                .id(99L)
                .cita(cita)
                .asignacionDiariaEspacio(asignacion)
                .numeroTurno(numeroTurno)
                .estado(estado)
                .intentosLlamado(intentos)
                .build();
        when(turnoRepository.findById(99L)).thenReturn(Optional.of(turno));
        when(turnoRepository.save(any(Turno.class))).thenAnswer(invocacion -> invocacion.getArgument(0));
        return turno;
    }

    private TableroTurnoDTO capturarTablero() {
        if (capturados.isEmpty()) {
            throw new AssertionError("No se publicó nada en el tablero");
        }
        // El publicador envía primero a /topic/tablero y luego a /topic/clinica/{id}.
        return (TableroTurnoDTO) capturados.get(0)[1];
    }

    @Test
    @DisplayName("Llamar publica tipoEvento LLAMADO con intentosLlamado, incluso al re-llamar el mismo turno")
    void testLlamarPublicaTipoEventoEIntentos() {
        turnoEn(8, "en_espera", 0);

        service.llamarTurno(99L, 7L);
        TableroTurnoDTO primero = capturarTablero();
        assertEquals("LLAMADO", primero.getTipoEvento());
        assertEquals(1, primero.getIntentosLlamado());
        assertEquals(8, primero.getTurnoActual());
        assertEquals("201", primero.getEspacioNumero());
        assertEquals("Pediatría General", primero.getSubespecialidadNombre());

        capturados.clear();

        service.llamarTurno(99L, 7L);
        TableroTurnoDTO segundo = capturarTablero();
        assertEquals("LLAMADO", segundo.getTipoEvento());
        assertEquals(2, segundo.getIntentosLlamado());
        assertEquals(8, segundo.getTurnoActual());
    }

    @Test
    @DisplayName("No responde publica ACTUALIZACION sin intentosLlamado")
    void testNoRespondePublicaActualizacion() {
        turnoEn(8, "llamado", 1);

        service.marcarNoResponde(99L, 7L, "No se presentó");
        TableroTurnoDTO tablero = capturarTablero();
        assertEquals("ACTUALIZACION", tablero.getTipoEvento());
        assertNull(tablero.getIntentosLlamado());
    }

    @Test
    @DisplayName("Reintegrar publica ACTUALIZACION sin intentosLlamado")
    void testReintegrarPublicaActualizacion() {
        turnoEn(8, "no_responde", 2);
        when(turnoRepository.obtenerSiguienteTurnoAtomico(ASIGNACION_ID)).thenReturn(9);

        service.reintegrarTurno(99L, ReintegrarTurnoRequestDTO.builder()
                .usuarioId(7L)
                .motivo("Regresó de laboratorio")
                .build());

        TableroTurnoDTO tablero = capturarTablero();
        assertEquals("ACTUALIZACION", tablero.getTipoEvento());
        assertNull(tablero.getIntentosLlamado());
    }

    @Test
    @DisplayName("Atendido publica ACTUALIZACION sin intentosLlamado")
    void testAtendidoPublicaActualizacion() {
        turnoEn(8, "llamado", 2);
        when(citaRepository.save(any(Cita.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        service.marcarAtendido(99L, 7L);

        TableroTurnoDTO tablero = capturarTablero();
        assertEquals("ACTUALIZACION", tablero.getTipoEvento());
        assertNull(tablero.getIntentosLlamado());
    }

    @Test
    @DisplayName("Check-in publica ACTUALIZACION sin intentosLlamado")
    void testCheckInPublicaActualizacion() {
        when(citaRepository.findById(1L)).thenReturn(Optional.of(cita));
        when(turnoRepository.findByCitaId(1L)).thenReturn(Optional.empty());
        when(asignacionRepository.findBySubespecialidadIdAndFecha(any(), any()))
                .thenReturn(Optional.of(asignacion));
        when(turnoRepository.obtenerSiguienteTurnoAtomico(anyLong())).thenReturn(1);
        when(turnoRepository.save(any(Turno.class))).thenAnswer(invocacion -> invocacion.getArgument(0));
        when(citaRepository.save(any(Cita.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        service.generarTurnoParaCita(GenerarTurnoRequestDTO.builder()
                .citaId(1L)
                .usuarioId(7L)
                .build());

        TableroTurnoDTO tablero = capturarTablero();
        assertEquals("ACTUALIZACION", tablero.getTipoEvento());
        assertNull(tablero.getIntentosLlamado());
    }

    /** Canal que acepta los mensajes; el converter ya registró el payload. */
    private static final class CanalCapturador implements MessageChannel {
        @Override
        public boolean send(Message<?> message) {
            return true;
        }

        @Override
        public boolean send(Message<?> message, long timeout) {
            return true;
        }
    }
}
