package com.thulirix.domain.entity;

import com.thulirix.domain.enums.IntegrationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "integration_configs",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_integration_project_type",
                columnNames = {"project_id", "integration_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationConfig extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "integration_type", nullable = false, length = 50)
    private IntegrationType integrationType;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    /**
     * Stores connection details as JSON.
     * Secrets are stored as Key Vault references — NOT raw values.
     * Example: {"org":"myorg","project":"myproj","pat_key_vault_ref":"thulirix-ado-pat"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config_json", columnDefinition = "jsonb", nullable = false)
    private String configJson;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @OneToMany(mappedBy = "integration", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<IntegrationFieldMapping> fieldMappings = new ArrayList<>();

    @OneToMany(mappedBy = "integration", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY)
    @Builder.Default
    private List<SyncState> syncStates = new ArrayList<>();
}
