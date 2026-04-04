package com.thulirix.dto.request;

import com.thulirix.domain.enums.IntegrationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateIntegrationRequest {

    @NotNull(message = "Integration type is required")
    private IntegrationType integrationType;

    @NotBlank(message = "Integration name is required")
    private String name;

    private String configJson;
}
