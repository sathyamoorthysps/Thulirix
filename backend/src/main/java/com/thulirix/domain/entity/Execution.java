package com.thulirix.domain.entity;

import com.thulirix.domain.enums.ExecutionResult;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "executions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_exec_run_tc",
                columnNames = {"run_id", "test_case_id"}),
        indexes = {
                @Index(name = "idx_exec_run", columnList = "run_id"),
                @Index(name = "idx_exec_tc", columnList = "test_case_id"),
                @Index(name = "idx_exec_result", columnList = "result"),
                @Index(name = "idx_exec_created", columnList = "created_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Execution extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private TestRun run;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @Column(name = "tc_version", nullable = false)
    private Integer tcVersion;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExecutionResult result = ExecutionResult.PENDING;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(length = 200)
    private String environment;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Defect IDs as JSON array: ["ADO-1234", "ADO-5678"]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "defect_ids", columnDefinition = "jsonb")
    private List<String> defectIds;

    @Column(name = "is_automated", nullable = false)
    @Builder.Default
    private boolean automated = false;

    @Column(name = "automation_tool", length = 100)
    private String automationTool;

    @Column(name = "automation_output", columnDefinition = "TEXT")
    private String automationOutput;

    @Column(name = "ado_result_id", length = 100)
    private String adoResultId;

    @OneToMany(mappedBy = "execution", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    @Builder.Default
    private List<ExecutionStep> steps = new ArrayList<>();
}
