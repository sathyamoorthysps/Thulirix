package com.thulirix.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.thulirix.domain.entity.TestCase;
import com.thulirix.domain.enums.AutomationStatus;
import com.thulirix.domain.enums.Priority;
import com.thulirix.domain.enums.TestCaseStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class TestCaseResponse {

    private UUID id;
    @JsonProperty("testCaseKey")
    private String tcKey;
    private String title;
    private String description;
    private String objective;
    private String preconditions;
    private String postconditions;
    private TestCaseStatus status;
    private Priority priority;
    private AutomationStatus automationStatus;
    private TestCase.AutomationMetadata automationMetadata;
    private Integer estimatedDurationMin;
    private String externalTcId;
    @JsonProperty("version")
    private Integer currentVersion;
    @JsonProperty("archived")
    private boolean deleted;
    private List<StepResponse> steps;
    private Set<TagResponse> tags;
    private Instant createdAt;
    private Instant updatedAt;
}
