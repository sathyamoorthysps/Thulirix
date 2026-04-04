package com.thulirix.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.thulirix.domain.enums.AutomationStatus;
import com.thulirix.domain.enums.Priority;
import com.thulirix.domain.enums.TestCaseStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TestCaseSummaryResponse {

    private UUID id;
    @JsonProperty("testCaseKey")
    private String tcKey;
    private String title;
    private TestCaseStatus status;
    private Priority priority;
    private AutomationStatus automationStatus;
    private List<TagResponse> tags;
    private Instant createdAt;
    private Instant updatedAt;
}
