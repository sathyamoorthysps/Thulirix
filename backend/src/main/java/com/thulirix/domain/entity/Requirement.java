package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "requirements",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_req_key_project",
                columnNames = {"project_id", "req_key"}),
        indexes = {
                @Index(name = "idx_req_project", columnList = "project_id"),
                @Index(name = "idx_req_external", columnList = "external_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Requirement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "req_key", nullable = false, length = 100)
    private String reqKey;      // e.g. REQ-001, ADO#4512

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;  // ADO_WORK_ITEM | SALESFORCE_CASE | MANUAL

    @Column(name = "external_id", length = 300)
    private String externalId;

    @Column(name = "external_url", columnDefinition = "TEXT")
    private String externalUrl;

    @Column(length = 50)
    private String priority;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
