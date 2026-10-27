package com.hro.system.archivo.service;

import com.hro.system.archivo.dto.CuadernoRojoResponseDTO;
import com.hro.system.archivo.dto.GuardarCuadernoRojoRequestDTO;
import com.hro.system.archivo.entity.RegistroCuadernoRojo;
import com.hro.system.archivo.repository.RegistroCuadernoRojoRepository;
import com.hro.system.auth.UsuarioContexto;
import com.hro.system.common.BusinessException;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

/**
 * Registro diario del Cuaderno Rojo. Es un dato propio de Archivo, capturado
 * manualmente y sin dependencias de otros módulos. Un mismo día se actualiza
 * en lugar de duplicarse.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CuadernoRojoService {

    private static final ZoneId ZONA_HORARIA = ZoneId.of("America/Guatemala");

    private final RegistroCuadernoRojoRepository repository;
    private final UsuarioReferenciaRepository usuarioRepository;

    @Transactional
    public CuadernoRojoResponseDTO guardar(LocalDate fecha, GuardarCuadernoRojoRequestDTO dto) {
        LocalDate dia = (fecha != null) ? fecha : LocalDate.now(ZONA_HORARIA);
        UsuarioReferencia usuario = usuarioActual();
        OffsetDateTime ahora = OffsetDateTime.now(ZONA_HORARIA);

        RegistroCuadernoRojo registro = repository.findByFecha(dia)
                .orElseGet(() -> RegistroCuadernoRojo.builder()
                        .fecha(dia)
                        .registradoPor(usuario)
                        .creadoEn(ahora)
                        .build());

        registro.setEgresosHospitalarios(dto.getEgresosHospitalarios());
        registro.setSobresEmergencia(dto.getSobresEmergencia());
        registro.setSobresSellados(dto.getSobresSellados());
        registro.setTia(dto.getTia());
        registro.setActualizadoPor(usuario);
        registro.setActualizadoEn(ahora);

        RegistroCuadernoRojo guardado = repository.save(registro);
        log.info("Cuaderno Rojo guardado para {} por usuario {}", dia,
                usuario != null ? usuario.getId() : null);
        return map(guardado);
    }

    @Transactional(readOnly = true)
    public Optional<CuadernoRojoResponseDTO> buscarPorFecha(LocalDate fecha) {
        return repository.findByFecha(fecha).map(this::map);
    }

    @Transactional(readOnly = true)
    public List<CuadernoRojoResponseDTO> listar(Integer anio, Integer mes) {
        if (anio == null && mes == null) {
            return repository.findAllByOrderByFechaDesc().stream().map(this::map).toList();
        }
        if (anio == null) {
            throw new BusinessException("Indique el año para filtrar el Cuaderno Rojo por mes.");
        }
        if (anio < 2000 || anio > 2100) {
            throw new BusinessException("El año indicado no es válido.");
        }

        LocalDate inicio;
        LocalDate fin;
        if (mes != null) {
            if (mes < 1 || mes > 12) {
                throw new BusinessException("El mes debe estar entre 1 y 12.");
            }
            YearMonth periodo = YearMonth.of(anio, mes);
            inicio = periodo.atDay(1);
            fin = periodo.atEndOfMonth();
        } else {
            inicio = LocalDate.of(anio, 1, 1);
            fin = LocalDate.of(anio, 12, 31);
        }
        return repository.findByFechaBetweenOrderByFechaDesc(inicio, fin).stream()
                .map(this::map)
                .toList();
    }

    private CuadernoRojoResponseDTO map(RegistroCuadernoRojo r) {
        return CuadernoRojoResponseDTO.builder()
                .id(r.getId())
                .fecha(r.getFecha())
                .egresosHospitalarios(r.getEgresosHospitalarios())
                .sobresEmergencia(r.getSobresEmergencia())
                .sobresSellados(r.getSobresSellados())
                .tia(r.getTia())
                .registradoPor(r.getRegistradoPor() != null
                        ? r.getRegistradoPor().getNombreMostrar() : null)
                .actualizadoPor(r.getActualizadoPor() != null
                        ? r.getActualizadoPor().getNombreMostrar() : null)
                .actualizadoEn(r.getActualizadoEn())
                .build();
    }

    private UsuarioReferencia usuarioActual() {
        return UsuarioContexto.actual()
                .flatMap(identidad -> usuarioRepository.findById(identidad.id()))
                .orElse(null);
    }
}
