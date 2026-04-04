package com.thulirix.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {

    private UUID id;
    private String name;
    private String slug;
    private String description;
    private boolean archived;
    private Instant createdAt;
    private Instant updatedAt;
    private int memberCount;
}
