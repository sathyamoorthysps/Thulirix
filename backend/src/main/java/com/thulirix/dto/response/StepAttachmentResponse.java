package com.thulirix.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class StepAttachmentResponse {
    private UUID id;
    private UUID testStepId;
    private String originalName;
    private String mimeType;
    private Long fileSize;
    private Instant createdAt;
    private String downloadUrl;
}
