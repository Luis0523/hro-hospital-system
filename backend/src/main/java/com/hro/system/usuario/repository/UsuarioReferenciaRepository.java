package com.hro.system.usuario.repository;

import com.hro.system.usuario.entity.UsuarioReferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioReferenciaRepository extends JpaRepository<UsuarioReferencia, Long> {
    Optional<UsuarioReferencia> findByIdExterno(String idExterno);

    List<UsuarioReferencia> findByActivo(boolean activo);

    List<UsuarioReferencia> findByRolPrincipal(String rolPrincipal);

    List<UsuarioReferencia> findByActivoAndRolPrincipal(boolean activo, String rolPrincipal);
}
