package com.thulirix.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTestPlanRequest {

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;

    private String environment;

    private String buildVersion;

    private LocalDate startDate;

    private LocalDate endDate;
}
