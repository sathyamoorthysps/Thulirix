package com.thulirix.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateTestPlanRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    private List<UUID> testCaseIds;
}
