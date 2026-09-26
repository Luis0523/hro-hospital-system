package com.hro.system.config;

import com.hro.system.auth.config.AuthProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringBootVersion;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

/**
 * Emite en los logs de arranque el estado del backend (version, perfil, conectividad
 * con PostgreSQL y Redis) usando emojis de exito/fallo para diagnostico rapido.
 */
@Component
@Slf4j
public class StartupInfoLogger {

    private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final Environment environment;
    private final DataSource dataSource;
    private final RedisConnectionFactory redisConnectionFactory;
    private final AuthProperties authProperties;
    private final Optional<BuildProperties> buildProperties;

    public StartupInfoLogger(Environment environment,
                             DataSource dataSource,
                             RedisConnectionFactory redisConnectionFactory,
                             AuthProperties authProperties,
                             Optional<BuildProperties> buildProperties) {
        this.environment = environment;
        this.dataSource = dataSource;
        this.redisConnectionFactory = redisConnectionFactory;
        this.authProperties = authProperties;
        this.buildProperties = buildProperties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void registrarArranque() {
        String version = buildProperties.map(BuildProperties::getVersion).orElse("desconocida");
        String perfil = String.join(",", environment.getActiveProfiles());
        if (perfil.isBlank()) {
            perfil = "default";
        }

        log.info("");
        log.info("\u2705 ==========================================================");
        log.info("\u2705  HRO HOSPITAL SYSTEM - BACKEND ARRANCO CORRECTAMENTE");
        log.info("\u2705 ==========================================================");
        log.info("\u2705  Version        : {}", version);
        log.info("\u2705  Perfil activo  : {}", perfil);
        log.info("\u2705  Java           : {}", System.getProperty("java.version"));
        log.info("\u2705  Spring Boot    : {}", SpringBootVersion.getVersion());
        log.info("\u2705  Inicio         : {}", LocalDateTime.now().format(FORMATO));
        log.info("   PostgreSQL     : {}", estadoPostgres());
        log.info("   Redis          : {}", estadoRedis());
        log.info("   Autenticacion  : {}", estadoAutenticacion());
        log.info("\u2705 ==========================================================");
        log.info("");
    }

    @EventListener(ContextClosedEvent.class)
    public void registrarApagado() {
        log.info("\uD83D\uDED1 BACKEND HRO DETENIDO - {}", LocalDateTime.now().format(FORMATO));
    }

    private String estadoPostgres() {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("SELECT 1");
            return "\u2705 conectado";
        } catch (Exception e) {
            log.error("\u274C Error de conexion a PostgreSQL: {}", e.getMessage());
            return "\u274C sin conexion";
        }
    }

    private String estadoRedis() {
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            connection.ping();
            return "\u2705 conectado";
        } catch (Exception e) {
            return "\u26A0\uFE0F no disponible (no requerido en v1)";
        }
    }

    private String estadoAutenticacion() {
        if ("mock".equalsIgnoreCase(authProperties.getMode())) {
            return "\uD83D\uDD10 MOCK (cabeceras X-Usuario-Id / X-Usuario-Rol; servicio externo pendiente)";
        }
        return "\uD83D\uDD10 EXTERNAL (servicio del hospital)";
    }
}
