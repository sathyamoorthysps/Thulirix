package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_plans", indexes = {
        @Index(name = "idx_plan_project", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestPlan extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT";  // DRAFT | ACTIVE | COMPLETED | ARCHIVED

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(length = 200)
    private String environment;

    @Column(name = "build_version", length = 200)
    private String buildVersion;

    @Column(name = "ado_plan_id", length = 100)
    private String adoPlanId;

    @OneToMany(mappedBy = "testPlan", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestPlanCase> planCases = new ArrayList<>();

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestRun> runs = new ArrayList<>();
}
