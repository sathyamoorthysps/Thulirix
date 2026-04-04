package com.thulirix.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateTestRunRequest {

    @NotBlank(message = "Run name is required")
    private String name;

    private String environment;

    private String buildVersion;

    private List<UUID> testCaseIds;
}
