package com.thulirix.repository;

import com.thulirix.domain.entity.SyncState;
import com.thulirix.domain.enums.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyncStateRepository extends JpaRepository<SyncState, UUID> {

    Optional<SyncState> findByIntegrationIdAndEntityTypeAndThulirixId(
            UUID integrationId, String entityType, UUID thulirixId);

    List<SyncState> findByIntegrationIdAndSyncStatusIn(UUID integrationId, List<SyncStatus> statuses);

    Optional<SyncState> findByExternalId(String externalId);
}
