package com.thulirix.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TagResponse {

    private UUID id;
    private String name;
    @JsonProperty("color")
    private String colorHex;
    private UUID projectId;
}
