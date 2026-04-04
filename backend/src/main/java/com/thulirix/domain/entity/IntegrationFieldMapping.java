package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "integration_field_mappings",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_field_mapping",
                columnNames = {"integration_id", "thulirix_field", "external_field"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationFieldMapping extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private IntegrationConfig integration;

    @Column(name = "thulirix_field", nullable = false, length = 200)
    private String thulirixField;   // e.g. "test_cases.priority"

    @Column(name = "external_field", nullable = false, length = 200)
    private String externalField;   // e.g. "Microsoft.VSTS.Common.Priority"

    @Column(name = "transform_expr", columnDefinition = "TEXT")
    private String transformExpr;   // e.g. "HIGH->2, CRITICAL->1"

    @Column(name = "sync_direction", nullable = false, length = 20)
    @Builder.Default
    private String syncDirection = "BIDIRECTIONAL";  // PUSH | PULL | BIDIRECTIONAL
}
