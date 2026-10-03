package com.hro.system.auth;

import com.hro.system.auth.config.AuthProperties;
import com.hro.system.auth.dto.IdentidadUsuario;
import com.hro.system.usuario.entity.UsuarioReferencia;
import com.hro.system.usuario.repository.UsuarioReferenciaRepository;
import com.hro.system.usuario.service.UsuarioReferenciaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KeycloakProveedorIdentidadTest {

    private JwtDecoder jwtDecoder;
    private UsuarioReferenciaRepository usuarioReferenciaRepository;
    private UsuarioReferenciaService usuarioReferenciaService;
    private AuthProperties authProperties;
    private KeycloakProveedorIdentidad proveedor;

    @BeforeEach
    void setUp() {
        jwtDecoder = mock(JwtDecoder.class);
        usuarioReferenciaRepository = mock(UsuarioReferenciaRepository.class);
        usuarioReferenciaService = mock(UsuarioReferenciaService.class);
        authProperties = new AuthProperties();
        authProperties.getKeycloak().setRolPorDefecto("enfermeria");
        proveedor = new KeycloakProveedorIdentidad(
                jwtDecoder, usuarioReferenciaRepository, usuarioReferenciaService, authProperties);
    }

    private MockHttpServletRequest requestConToken(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        return request;
    }

    private Jwt jwtConRol(String rol, String username) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("sub-" + username)
                .claim("preferred_username", username)
                .claim("name", "Nombre " + username)
                .claim("realm_access", Map.of("roles", List.of(rol)))
                .build();
    }

    @Test
    @DisplayName("Resuelve la identidad y aprovisiona el usuario JIT con el rol del token")
    void resuelveIdentidadYJIT() {
        when(jwtDecoder.decode("token")).thenReturn(jwtConRol("archivo", "archivo01"));
        when(usuarioReferenciaRepository.findByIdExterno("sub-archivo01")).thenReturn(Optional.empty());
        when(usuarioReferenciaService.sincronizarUsuarioJIT(eq("sub-archivo01"), anyString(), eq("archivo")))
                .thenReturn(UsuarioReferencia.builder()
                        .id(7L)
                        .idExterno("sub-archivo01")
                        .nombreMostrar("Nombre archivo01")
                        .rolPrincipal("archivo")
                        .activo(true)
                        .build());

        Optional<IdentidadUsuario> identidad = proveedor.resolver(requestConToken("token"));

        assertTrue(identidad.isPresent());
        assertEquals(7L, identidad.get().id());
        assertEquals("sub-archivo01", identidad.get().idExterno());
        assertEquals("archivo", identidad.get().rolPrincipal());
    }

    @Test
    @DisplayName("Usa el rol por defecto cuando el token no trae roles conocidos")
    void rolPorDefecto() {
        when(jwtDecoder.decode("token")).thenReturn(jwtConRol("rol_desconocido", "user"));
        when(usuarioReferenciaRepository.findByIdExterno("sub-user")).thenReturn(Optional.empty());
        when(usuarioReferenciaService.sincronizarUsuarioJIT(eq("sub-user"), anyString(), eq("enfermeria")))
                .thenReturn(UsuarioReferencia.builder()
                        .id(3L).idExterno("sub-user").nombreMostrar("Nombre user")
                        .rolPrincipal("enfermeria").activo(true).build());

        Optional<IdentidadUsuario> identidad = proveedor.resolver(requestConToken("token"));

        assertTrue(identidad.isPresent());
        assertEquals("enfermeria", identidad.get().rolPrincipal());
    }

    @Test
    @DisplayName("Token inválido o ausente no resuelve identidad")
    void tokenInvalido() {
        when(jwtDecoder.decode("malo")).thenThrow(new JwtException("firma inválida"));

        assertTrue(proveedor.resolver(requestConToken("malo")).isEmpty());
        assertTrue(proveedor.resolver(new MockHttpServletRequest()).isEmpty());
    }

    @Test
    @DisplayName("El modo reportado es 'keycloak'")
    void modo() {
        assertEquals("keycloak", proveedor.modo());
    }
}
