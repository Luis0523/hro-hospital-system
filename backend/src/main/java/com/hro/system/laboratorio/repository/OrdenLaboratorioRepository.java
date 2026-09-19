package com.hro.system.laboratorio.repository;

import com.hro.system.laboratorio.entity.OrdenLaboratorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrdenLaboratorioRepository extends JpaRepository<OrdenLaboratorio, UUID> {
    List<OrdenLaboratorio> findByCitaId(Long citaId);
    List<OrdenLaboratorio> findByCitaIdAndEstado(Long citaId, String estado);
}
