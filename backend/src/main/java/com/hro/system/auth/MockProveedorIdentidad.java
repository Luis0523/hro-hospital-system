package com.hro.system.auth;

import com.hro.system.auth.config.AuthProperties;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import com.hro.system.usuario.service.UsuarioReferenciaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Proveedor de identidad simulado para pruebas (modo {@code hro.auth.mode=mock}).
 * <p>
 * Toma la identidad de las cabeceras HTTP:
 * <ul>
 *   <li>{@code X-Usuario-Id}     - identificador externo (ej. {@code enfermeria-01}).</li>
 *   <li>{@code X-Usuario-Rol}    - rol operativo (ej. {@code enfermeria}).</li>
 *   <li>{@code X-Usuario-Nombre} - nombre a mostrar (opcional).</li>
 * </ul>
 * Si no se envían, usa los valores por defecto configurados. El usuario se aprovisiona
 * con JIT (just-in-time) replicando el flujo previsto con el servicio externo del hospital.
 */
@Component
@ConditionalOnProperty(prefix = "hro.auth", name = "mode", havingValue = "mock", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class MockProveedorIdentidad implements ProveedorIdentidad {

    private final AuthProperties authProperties;
    private final UsuarioReferenciaRepository usuarioReferenciaRepository;
    private final UsuarioReferenciaService usuarioReferenciaService;

    @Override
    public Optional<IdentidadUsuario> resolver(HttpServletRequest request) {
        AuthProperties.Mock mock = authProperties.getMock();
        String idExterno = valorHeader(request, "X-Usuario-Id", mock.getDefaultIdExterno());
        String rol = valorHeader(request, "X-Usuario-Rol", mock.getDefaultRol());
        String nombre = valorHeader(request, "X-Usuario-Nombre", mock.getDefaultNombre());

        try {
            UsuarioReferencia usuario = usuarioReferenciaRepository.findByIdExterno(idExterno)
                    .orElseGet(() -> usuarioReferenciaService.sincronizarUsuarioJIT(idExterno, nombre, rol));

            return Optional.of(new IdentidadUsuario(
                    usuario.getId(),
                    usuario.getIdExterno(),
                    usuario.getNombreMostrar(),
                    usuario.getRolPrincipal()));
        } catch (Exception e) {
            log.warn("No se pudo resolver ni aprovisionar el usuario simulado '{}' (rol '{}'): {}",
                    idExterno, rol, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public String modo() {
        return "mock";
    }

    private String valorHeader(HttpServletRequest request, String nombre, String valorDefecto) {
        String valor = request.getHeader(nombre);
        return (valor != null && !valor.isBlank()) ? valor.trim() : valorDefecto;
    }
}
