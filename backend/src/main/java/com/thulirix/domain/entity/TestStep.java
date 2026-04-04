package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "test_steps", indexes = {
        @Index(name = "idx_ts_test_case", columnList = "test_case_id,step_order")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestStep extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String action;

    @Column(name = "expected_result", nullable = false, columnDefinition = "TEXT")
    private String expectedResult;

    @Column(name = "test_data", columnDefinition = "TEXT")
    private String testData;

    @Column(name = "is_shared_step", nullable = false)
    @Builder.Default
    private boolean sharedStep = false;

    @Column(name = "shared_step_ref_id")
    private UUID sharedStepRefId;
}
