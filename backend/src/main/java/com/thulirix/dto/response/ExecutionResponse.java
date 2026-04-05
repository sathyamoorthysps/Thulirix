package com.thulirix.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.thulirix.domain.enums.ExecutionResult;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ExecutionResponse {

    @JsonProperty("id")
    private UUID executionId;

    private UUID testCaseId;

    @JsonProperty("testCaseKey")
    private String tcKey;

    @JsonProperty("testCaseTitle")
    private String title;

    private ExecutionResult result;
    private String environment;

    @JsonProperty("executedBy")
    private UUID assignedTo;

    private Instant startedAt;

    @JsonProperty("executedAt")
    private Instant completedAt;

    private Integer durationMs;
    private String notes;
    private boolean isAutomated;
}
