package com.thulirix.domain.entity;

import com.thulirix.domain.enums.RunTrigger;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_runs", indexes = {
        @Index(name = "idx_run_plan", columnList = "plan_id"),
        @Index(name = "idx_run_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestRun extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private TestPlan plan;

    @Column(nullable = false, length = 300)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 30)
    @Builder.Default
    private RunTrigger triggerType = RunTrigger.MANUAL;

    @Column(length = 200)
    private String environment;

    @Column(name = "build_version", length = 200)
    private String buildVersion;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    // Denormalised counters — updated by service after each execution change
    @Column(name = "total_count", nullable = false)
    @Builder.Default
    private Integer totalCount = 0;

    @Column(name = "passed_count", nullable = false)
    @Builder.Default
    private Integer passedCount = 0;

    @Column(name = "failed_count", nullable = false)
    @Builder.Default
    private Integer failedCount = 0;

    @Column(name = "blocked_count", nullable = false)
    @Builder.Default
    private Integer blockedCount = 0;

    @Column(name = "skipped_count", nullable = false)
    @Builder.Default
    private Integer skippedCount = 0;

    @Column(name = "ado_run_id", length = 100)
    private String adoRunId;

    @OneToMany(mappedBy = "run", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Execution> executions = new ArrayList<>();
}
