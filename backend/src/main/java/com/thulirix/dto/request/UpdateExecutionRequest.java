package com.thulirix.dto.request;

import com.thulirix.domain.enums.ExecutionResult;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdateExecutionRequest {

    @NotNull(message = "Execution result is required")
    private ExecutionResult result;

    private String notes;

    private List<String> defectIds;

    private String automationOutput;

    private Integer durationMs;
}
