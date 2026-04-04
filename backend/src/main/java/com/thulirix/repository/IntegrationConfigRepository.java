package com.thulirix.repository;

import com.thulirix.domain.entity.IntegrationConfig;
import com.thulirix.domain.enums.IntegrationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationConfigRepository extends JpaRepository<IntegrationConfig, UUID> {

    List<IntegrationConfig> findByProjectId(UUID projectId);

    Optional<IntegrationConfig> findByProjectIdAndIntegrationType(UUID projectId, IntegrationType integrationType);

    Optional<IntegrationConfig> findByProjectIdAndId(UUID projectId, UUID id);
}
