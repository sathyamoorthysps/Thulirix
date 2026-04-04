package com.thulirix.dto.request;

import com.thulirix.domain.entity.TestCase;
import com.thulirix.domain.enums.AutomationStatus;
import com.thulirix.domain.enums.Priority;
import com.thulirix.domain.enums.TestCaseStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
public class UpdateTestCaseRequest {

    @Size(max = 500, message = "Title must not exceed 500 characters")
    private String title;

    private String description;

    private String objective;

    private String preconditions;

    private String postconditions;

    private Priority priority;

    private TestCaseStatus status;

    private AutomationStatus automationStatus;

    private TestCase.AutomationMetadata automationMetadata;

    private Set<UUID> tagIds;

    @Valid
    private List<StepRequest> steps;

    private String changeSummary;

    @Data
    public static class StepRequest {

        private String action;

        private String expectedResult;

        private String testData;
    }
}
