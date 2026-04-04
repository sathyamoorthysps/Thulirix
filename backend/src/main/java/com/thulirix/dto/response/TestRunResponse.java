package com.thulirix.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.thulirix.domain.enums.RunTrigger;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TestRunResponse {

    private UUID id;
    private UUID planId;
    private String name;
    private RunTrigger triggerType;
    private String environment;
    private String buildVersion;
    private Instant startedAt;
    private Instant completedAt;

    @JsonProperty("totalCases")
    private int totalCount;
    @JsonProperty("passed")
    private int passedCount;
    @JsonProperty("failed")
    private int failedCount;
    @JsonProperty("blocked")
    private int blockedCount;
    @JsonProperty("skipped")
    private int skippedCount;

    public String getStatus() {
        if (completedAt != null) return "COMPLETED";
        if (startedAt != null) return "IN_PROGRESS";
        return "PENDING";
    }

    public Double getPassRate() {
        if (totalCount == 0) return null;
        return Math.round((passedCount * 100.0 / totalCount) * 100.0) / 100.0;
    }
}
