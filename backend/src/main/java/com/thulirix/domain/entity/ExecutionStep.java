package com.thulirix.domain.entity;

import com.thulirix.domain.enums.ExecutionResult;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "execution_steps", indexes = {
        @Index(name = "idx_exec_steps", columnList = "execution_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecutionStep extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_id", nullable = false)
    private Execution execution;

    @Column(name = "step_id")
    private UUID stepId;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String action;

    @Column(name = "expected_result", nullable = false, columnDefinition = "TEXT")
    private String expectedResult;

    @Column(name = "actual_result", columnDefinition = "TEXT")
    private String actualResult;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ExecutionResult result = ExecutionResult.PENDING;

    @Column(name = "screenshot_url", columnDefinition = "TEXT")
    private String screenshotUrl;
}
