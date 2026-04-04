package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "test_plan_cases",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_plan_case",
                columnNames = {"plan_id", "test_case_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestPlanCase extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private TestPlan testPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "tc_version", nullable = false)
    private Integer tcVersion;
}
