package com.thulirix.domain.entity;

import com.thulirix.domain.enums.AutomationStatus;
import com.thulirix.domain.enums.Priority;
import com.thulirix.domain.enums.TestCaseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "test_cases", indexes = {
        @Index(name = "idx_tc_project", columnList = "project_id"),
        @Index(name = "idx_tc_key_project", columnList = "project_id,tc_key", unique = true),
        @Index(name = "idx_tc_status", columnList = "project_id,status"),
        @Index(name = "idx_tc_external", columnList = "external_tc_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCase extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "tc_key", nullable = false, length = 50)
    private String tcKey;  // e.g. TC-0042

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Column(columnDefinition = "TEXT")
    private String preconditions;

    @Column(columnDefinition = "TEXT")
    private String postconditions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TestCaseStatus status = TestCaseStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "automation_status", nullable = false, length = 30)
    @Builder.Default
    private AutomationStatus automationStatus = AutomationStatus.NOT_AUTOMATED;

    // Automation metadata stored as JSONB
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "automation_metadata", columnDefinition = "jsonb")
    private AutomationMetadata automationMetadata;

    @Column(name = "estimated_duration_min")
    private Integer estimatedDurationMin;

    @Column(name = "external_tc_id", length = 200)
    private String externalTcId;  // ADO work item ID / Salesforce ID

    @Column(name = "current_version", nullable = false)
    @Builder.Default
    private Integer currentVersion = 1;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean deleted = false;

    // Steps
    @OneToMany(mappedBy = "testCase", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    @Builder.Default
    private List<TestStep> steps = new ArrayList<>();

    // Versions
    @OneToMany(mappedBy = "testCase", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestCaseVersion> versions = new ArrayList<>();

    // Tags
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "test_case_tags",
            joinColumns = @JoinColumn(name = "test_case_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    // Requirements (RTM)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "test_case_requirements",
            joinColumns = @JoinColumn(name = "test_case_id"),
            inverseJoinColumns = @JoinColumn(name = "requirement_id"))
    @Builder.Default
    private Set<Requirement> requirements = new HashSet<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AutomationMetadata {
        private String scriptPath;
        private String gitRepoUrl;
        private String className;
        private String methodName;
        private String frameworkType;
        private String ciJobName;
        private String ciPipelineRef;
    }


}
