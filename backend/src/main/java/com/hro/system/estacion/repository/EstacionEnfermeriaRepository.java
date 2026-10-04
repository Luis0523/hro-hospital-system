package com.hro.system.estacion.repository;

import com.hro.system.estacion.entity.EstacionEnfermeria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EstacionEnfermeriaRepository extends JpaRepository<EstacionEnfermeria, Long> {

    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Long id);

    List<EstacionEnfermeria> findByActivoOrderByCodigoAsc(Boolean activo);

    List<EstacionEnfermeria> findAllByOrderByCodigoAsc();
}
