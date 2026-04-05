package com.thulirix.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateTestPlanRequest {

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;

    private String environment;

    private String buildVersion;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<UUID> testCaseIds;
}
