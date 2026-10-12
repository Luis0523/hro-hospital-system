package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.DepurarExpedienteRequestDTO;
import com.hro.system.archivo.dto.ExpedienteDepuradoResponseDTO;
import com.hro.system.archivo.entity.Expediente;
import com.hro.system.archivo.entity.ExpedienteDepuracion;
import com.hro.system.archivo.repository.ExpedienteDepuracionRepository;
import com.hro.system.archivo.repository.ExpedienteRepository;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.common.ConflictException;
import com.hro.system.common.ResourceNotFoundException;
import com.hro.system.paciente.entity.Paciente;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Depuración (baja lógica) de expedientes de Archivo. Marca un expediente como
 * "ya no existe en el sistema" y deja bitácora inmutable.
 * <p>
 * La señal hacia otras pantallas se resuelve en la búsqueda: el expediente
 * depurado viaja con {@code depurado = true} en {@code ExpedienteResponseDTO}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DepuracionArchivoService {

    private static final ZoneId ZONA_HOSPITAL = ZoneId.of("America/Guatemala");

    private final ExpedienteRepository expedienteRepository;
    private final ExpedienteDepuracionRepository depuracionRepository;
    private final UsuarioReferenciaRepository usuarioRepository;

    @Transactional
    public ExpedienteDepuradoResponseDTO depurar(DepurarExpedienteRequestDTO dto) {
        String numero = dto.getNumeroExpediente().trim();
        Expediente expediente = expedienteRepository.findByNumeroExpediente(numero)
                .orElseThrow(() -> new ResourceNotFoundException("Expediente", "numeroExpediente", numero));

        if (Boolean.TRUE.equals(expediente.getDepurado())) {
            throw new ConflictException("EXPEDIENTE_YA_DEPURADO",
                    "El expediente '" + numero + "' ya fue depurado.", null);
        }

        UsuarioReferencia usuario = usuarioActual();
        OffsetDateTime ahora = OffsetDateTime.now();
        Paciente paciente = expediente.getPaciente();

        expediente.setDepurado(true);
        expediente.setDepuradoEn(ahora);
        expediente.setDepuradoPor(usuario);
        expediente.setMotivoDepuracion(dto.getMotivo());
        expedienteRepository.save(expediente);

        ExpedienteDepuracion registro = depuracionRepository.save(ExpedienteDepuracion.builder()
                .expediente(expediente)
                .numeroExpediente(numero)
                .paciente(paciente)
                .pacienteNombre(nombrePaciente(paciente))
                .motivo(dto.getMotivo())
                .usuario(usuario)
                .depuradoEn(ahora)
                .build());

        log.info("Expediente {} depurado por '{}'", numero, nombreUsuario(usuario));
        return map(registro);
    }

    @Transactional(readOnly = true)
    public List<ExpedienteDepuradoResponseDTO> listarPorFecha(LocalDate fecha) {
        LocalDate dia = (fecha != null) ? fecha : LocalDate.now(ZONA_HOSPITAL);
        OffsetDateTime desde = dia.atStartOfDay(ZONA_HOSPITAL).toOffsetDateTime();
        OffsetDateTime hasta = dia.plusDays(1).atStartOfDay(ZONA_HOSPITAL).toOffsetDateTime();
        return depuracionRepository.listarEntre(desde, hasta).stream().map(this::map).toList();
    }

    private ExpedienteDepuradoResponseDTO map(ExpedienteDepuracion registro) {
        return ExpedienteDepuradoResponseDTO.builder()
                .id(registro.getId())
                .expedienteId(registro.getExpediente() != null ? registro.getExpediente().getId() : null)
                .numeroExpediente(registro.getNumeroExpediente())
                .pacienteNombre(registro.getPacienteNombre())
                .motivo(registro.getMotivo())
                .usuarioNombre(nombreUsuario(registro.getUsuario()))
                .depuradoEn(registro.getDepuradoEn())
                .build();
    }

    private UsuarioReferencia usuarioActual() {
        Long id = UsuarioContexto.idActual();
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UsuarioReferencia", "id", id));
    }

    private String nombrePaciente(Paciente paciente) {
        if (paciente == null) {
            return null;
        }
        return (paciente.getNombres() + " " + paciente.getApellidos()).trim();
    }

    private String nombreUsuario(UsuarioReferencia usuario) {
        return (usuario != null) ? usuario.getNombreMostrar() : null;
    }
}
