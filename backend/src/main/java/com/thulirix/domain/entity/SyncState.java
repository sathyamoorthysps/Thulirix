package com.thulirix.domain.entity;

import com.thulirix.domain.enums.SyncStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sync_states",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_sync_entity",
                columnNames = {"integration_id", "entity_type", "thulirix_id"}),
        indexes = {
                @Index(name = "idx_sync_status", columnList = "sync_status"),
                @Index(name = "idx_sync_type", columnList = "entity_type, integration_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncState extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private IntegrationConfig integration;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;      // TEST_CASE | REQUIREMENT | RUN

    @Column(name = "thulirix_id", nullable = false)
    private UUID thulirixId;

    @Column(name = "external_id", nullable = false, length = 200)
    private String externalId;      // ADO work item ID / SF record ID

    @Column(name = "external_revision")
    private Integer externalRevision;  // ADO rev number for deterministic conflict detection

    @Column(name = "last_pushed_at")
    private Instant lastPushedAt;

    @Column(name = "last_pulled_at")
    private Instant lastPulledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 30)
    @Builder.Default
    private SyncStatus syncStatus = SyncStatus.SYNCED;

    // Stores both conflicting versions as JSON for manual resolution
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "conflict_data", columnDefinition = "jsonb")
    private String conflictData;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
