package com.hro.system.usuario.repository;

import com.hro.system.usuario.entity.UsuarioReferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioReferenciaRepository extends JpaRepository<UsuarioReferencia, Long> {
    Optional<UsuarioReferencia> findByIdExterno(String idExterno);
}
