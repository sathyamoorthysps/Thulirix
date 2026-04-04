package com.thulirix.dto.response;

import com.thulirix.domain.enums.Priority;
import com.thulirix.domain.enums.TestCaseStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TestCaseVersionSummary {

    private UUID id;
    private int versionNumber;
    private String title;
    private TestCaseStatus status;
    private Priority priority;
    private String changeSummary;
    private UUID createdBy;
    private Instant createdAt;
}
