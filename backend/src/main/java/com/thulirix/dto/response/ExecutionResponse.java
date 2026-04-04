package com.thulirix.dto.response;

import com.thulirix.domain.enums.ExecutionResult;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ExecutionResponse {

    private UUID executionId;
    private UUID testCaseId;
    private String tcKey;
    private String title;
    private ExecutionResult result;
    private String environment;
    private UUID assignedTo;
    private Instant startedAt;
    private Instant completedAt;
    private Integer durationMs;
    private String notes;
    private boolean isAutomated;
}
