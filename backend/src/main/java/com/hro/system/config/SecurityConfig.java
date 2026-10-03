package com.hro.system.config;

import com.hro.system.auth.config.AuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthProperties authProperties;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if ("keycloak".equalsIgnoreCase(authProperties.getMode())) {
            // Modo Keycloak: se valida el JWT del resource server y se exige autenticación.
            http
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(rutasPublicas()).permitAll()
                    .anyRequest().authenticated());
        } else {
            // Modo mock/external: la identidad se resuelve por cabeceras (filtro de identidad).
            http.authorizeHttpRequests(auth -> auth
                .requestMatchers(rutasPublicas()).permitAll()
                .anyRequest().permitAll());
        }

        return http.build();
    }

    private String[] rutasPublicas() {
        return new String[]{
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/ws-turnos/**",
            "/api/v1/auth/**"
        };
    }
}
