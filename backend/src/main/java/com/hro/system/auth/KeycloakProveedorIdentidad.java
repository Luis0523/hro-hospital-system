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
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Proveedor de identidad para Keycloak (modo {@code hro.auth.mode=keycloak}).
 * <p>
 * Valida el JWT del header {@code Authorization: Bearer …} contra el realm configurado,
 * mapea {@code sub}/{@code preferred_username}, nombre y roles de {@code realm_access.roles}
 * a {@link IdentidadUsuario}, y aprovisiona el usuario JIT en {@code usuario_referencia}.
 * <p>
 * El hospital ya cuenta con Keycloak; el realm de ejemplo local sirve de simulación hasta
 * recibir su configuración real.
 */
@Component
@ConditionalOnProperty(prefix = "hro.auth", name = "mode", havingValue = "keycloak")
@RequiredArgsConstructor
@Slf4j
public class KeycloakProveedorIdentidad implements ProveedorIdentidad {

    private static final String PREFIJO_BEARER = "Bearer ";
    private static final String CLAIM_REALM_ACCESS = "realm_access";
    private static final String CLAIM_ROLES = "roles";

    /** Roles operativos reconocidos por el sistema (los demás se ignoran para el rol principal). */
    private static final Set<String> ROLES_CONOCIDOS = Set.of(
            "personal_citas", "enfermeria", "medico", "administrador", "archivo", "jefe_enfermeria");

    private final JwtDecoder jwtDecoder;
    private final UsuarioReferenciaRepository usuarioReferenciaRepository;
    private final UsuarioReferenciaService usuarioReferenciaService;
    private final AuthProperties authProperties;

    @Override
    public Optional<IdentidadUsuario> resolver(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(PREFIJO_BEARER)) {
            return Optional.empty();
        }

        String token = header.substring(PREFIJO_BEARER.length()).trim();
        if (token.isEmpty()) {
            return Optional.empty();
        }

        try {
            Jwt jwt = jwtDecoder.decode(token);
            String idExterno = primeroNoVacio(jwt.getSubject(), jwt.getClaimAsString("preferred_username"));
            if (idExterno == null) {
                log.warn("Token Keycloak sin 'sub' ni 'preferred_username'; no se resuelve identidad.");
                return Optional.empty();
            }
            String nombre = primeroNoVacio(jwt.getClaimAsString("name"),
                    jwt.getClaimAsString("preferred_username"), idExterno);
            String rol = extraerRol(jwt);

            UsuarioReferencia usuario = usuarioReferenciaRepository.findByIdExterno(idExterno)
                    .orElseGet(() -> usuarioReferenciaService.sincronizarUsuarioJIT(idExterno, nombre, rol));

            return Optional.of(new IdentidadUsuario(
                    usuario.getId(),
                    usuario.getIdExterno(),
                    usuario.getNombreMostrar(),
                    usuario.getRolPrincipal()));
        } catch (JwtException e) {
            log.warn("Token Keycloak inválido: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public String modo() {
        return "keycloak";
    }

    /**
     * Extrae el rol principal del claim {@code realm_access.roles}: prioriza los roles conocidos
     * por el sistema; si no hay ninguno, usa el rol por defecto configurado.
     */
    private String extraerRol(Jwt jwt) {
        Object realmAccess = jwt.getClaim(CLAIM_REALM_ACCESS);
        if (realmAccess instanceof java.util.Map<?, ?> mapa) {
            Object rolesObj = mapa.get(CLAIM_ROLES);
            if (rolesObj instanceof List<?> roles) {
                return roles.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .filter(ROLES_CONOCIDOS::contains)
                        .findFirst()
                        .orElse(authProperties.getKeycloak().getRolPorDefecto());
            }
        }
        return authProperties.getKeycloak().getRolPorDefecto();
    }

    private static String primeroNoVacio(String... valores) {
        for (String valor : valores) {
            if (valor != null && !valor.isBlank()) {
                return valor;
            }
        }
        return null;
    }
}
