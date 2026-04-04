package com.thulirix.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProjectRequest {

    @Size(max = 200, message = "Project name must not exceed 200 characters")
    private String name;

    private String description;
}
