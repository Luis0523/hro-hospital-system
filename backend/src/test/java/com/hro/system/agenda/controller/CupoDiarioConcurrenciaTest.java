package com.hro.system.agenda.controller;

import com.hro.system.agenda.entity.CupoDiario;
import com.hro.system.agenda.repository.CupoDiarioRepository;
import com.hro.system.agenda.service.CupoDiarioService;
import com.hro.system.clinica.entity.Especialidad;
import com.hro.system.clinica.entity.Subespecialidad;
import com.hro.system.clinica.repository.EspecialidadRepository;
import com.hro.system.clinica.repository.SubespecialidadRepository;
import com.hro.system.common.CupoAgotadoException;
import com.hro.system.espacio.entity.EspacioFisico;
import com.hro.system.espacio.repository.EspacioFisicoRepository;
import com.hro.system.medico.entity.Medico;
import com.hro.system.clinica.entity.SubespecialidadHorario;
import com.hro.system.medico.repository.MedicoRepository;
import com.hro.system.clinica.repository.SubespecialidadHorarioRepository;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class CupoDiarioConcurrenciaTest {

    @Autowired
    private CupoDiarioService cupoDiarioService;

    @Autowired
    private CupoDiarioRepository cupoDiarioRepository;

    @Autowired
    private SubespecialidadHorarioRepository subespecialidadHorarioRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private EspacioFisicoRepository espacioFisicoRepository;

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @Autowired
    private SubespecialidadRepository subespecialidadRepository;

    @Autowired
    private UsuarioReferenciaRepository usuarioReferenciaRepository;

    @Autowired
    private com.hro.system.cita.repository.CitaRepository citaRepository;

    @Autowired
    private com.hro.system.turno.repository.TurnoRepository turnoRepository;

    @Autowired
    private com.hro.system.cita.repository.CitaEstadoHistorialRepository historialRepository;

    @Autowired
    private com.hro.system.archivo.repository.ExpedienteCicloRepository expedienteCicloRepository;

    @Autowired
    private com.hro.system.archivo.repository.ExpedienteMovimientoRepository expedienteMovimientoRepository;

    private SubespecialidadHorario medicoSubespecialidadTest;
    private LocalDate proximoLunes;

    @BeforeEach
    void setUp() {
        expedienteMovimientoRepository.deleteAllInBatch();
        expedienteCicloRepository.deleteAllInBatch();
        turnoRepository.deleteAllInBatch();
        historialRepository.deleteAllInBatch();
        citaRepository.deleteAllInBatch();
        cupoDiarioRepository.deleteAllInBatch();

        proximoLunes = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));

        Especialidad esp = especialidadRepository.save(Especialidad.builder()
                .nombre("Especialidad Concurrencia " + UUID.randomUUID().toString().substring(0, 5))
                .activo(true)
                .build());

        Subespecialidad subesp = subespecialidadRepository.save(Subespecialidad.builder()
                .especialidad(esp)
                .nombre("Subespecialidad Concurrencia " + UUID.randomUUID().toString().substring(0, 5))
                .activo(true)
                .build());

        // El espacio físico ya no se liga a la subespecialidad; se crea por separado.
        espacioFisicoRepository.save(EspacioFisico.builder()
                .numero("S-" + UUID.randomUUID().toString().substring(0, 5))
                .nivel((short) 1)
                .capacidadCamillas(1)
                .nombre("Sala Test Concurrencia")
                .activo(true)
                .build());

        UsuarioReferencia usuario = usuarioReferenciaRepository.save(UsuarioReferencia.builder()
                .idExterno("user-conc-" + UUID.randomUUID().toString().substring(0, 6))
                .nombreMostrar("Dr. Concurrente")
                .rolPrincipal("medico")
                .activo(true)
                .build());

        Medico medico = medicoRepository.save(Medico.builder()
                .nombres("Dr. Concurrente Atomico")
                .numeroColegiado("COL-" + UUID.randomUUID().toString().substring(0, 6))
                .usuarioReferencia(usuario)
                .activo(true)
                .build());

        // Capacidad intencionalmente baja (3 cupos) para probar saturación y concurrencia
        medicoSubespecialidadTest = subespecialidadHorarioRepository.save(SubespecialidadHorario.builder()
                .subespecialidad(subesp)
                .diaSemana((short) 1) // Lunes
                .horaInicio(LocalTime.of(8, 0))
                .horaFin(LocalTime.of(12, 0))
                .capacidadMaxima(3) // SOLO 3 CUPOS
                .duracionConsultaMinutos(30)
                .activo(true)
                .build());
    }

    @Test
    @DisplayName("SCRUM-78: Simular 10 hilos simultáneos compitiendo por 3 cupos (Cero Overbooking garantizado)")
    void testReservaConcurrenteAtomica() throws InterruptedException {
        int totalHilos = 10;
        int capacidadEsperada = 3;

        ExecutorService executor = Executors.newFixedThreadPool(totalHilos);
        CountDownLatch latchInicio = new CountDownLatch(1);
        CountDownLatch latchFin = new CountDownLatch(totalHilos);

        AtomicInteger exitos = new AtomicInteger(0);
        AtomicInteger rechazados = new AtomicInteger(0);
        java.util.List<Throwable> errores = java.util.Collections.synchronizedList(new java.util.ArrayList<>());

        for (int i = 0; i < totalHilos; i++) {
            executor.submit(() -> {
                try {
                    latchInicio.await(); // Todos los hilos esperan aquí para arrancar al mismo milisegundo exacto
                    cupoDiarioService.reservarCupoAtomico(medicoSubespecialidadTest.getId(), proximoLunes);
                    exitos.incrementAndGet();
                } catch (CupoAgotadoException e) {
                    rechazados.incrementAndGet();
                } catch (Throwable e) {
                    errores.add(e);
                } finally {
                    latchFin.countDown();
                }
            });
        }

        latchInicio.countDown();
        latchFin.await();
        executor.shutdown();

        if (!errores.isEmpty()) {
            fail("Hubo errores inesperados en los hilos: " + errores.get(0).getMessage());
        }

        assertEquals(capacidadEsperada, exitos.get(), "Exactamente 3 reservas deben haber tenido éxito");
        assertEquals(totalHilos - capacidadEsperada, rechazados.get(), "Exactamente 7 solicitudes deben haber sido rechazadas");

        CupoDiario cupoFinal = cupoDiarioRepository.findBySubespecialidadHorarioIdAndFecha(medicoSubespecialidadTest.getId(), proximoLunes).orElseThrow();
        assertEquals(3, cupoFinal.getCuposOcupados(), "La cantidad física de cupos ocupados en BD debe ser exactamente 3");
        assertEquals(3, cupoFinal.getCapacidadMaxima());

        cupoDiarioService.liberarCupoAtomico(cupoFinal.getId());

        CupoDiario cupoTrasLiberar = cupoDiarioRepository.findById(cupoFinal.getId()).orElseThrow();
        assertEquals(2, cupoTrasLiberar.getCuposOcupados(), "Tras liberar 1 cupo, deben quedar 2 ocupados");

        assertDoesNotThrow(() -> cupoDiarioService.reservarCupoAtomico(medicoSubespecialidadTest.getId(), proximoLunes));

        CupoDiario cupoTrasNuevoIntento = cupoDiarioRepository.findById(cupoFinal.getId()).orElseThrow();
        assertEquals(3, cupoTrasNuevoIntento.getCuposOcupados(), "Vuelve a estar lleno en 3");
    }
}
