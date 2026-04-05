package com.thulirix.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class StepResponse {

    private UUID id;
    @JsonProperty("stepNumber")
    private int stepOrder;
    private String action;
    private String expectedResult;
    private String testData;
    private boolean sharedStep;

    @Builder.Default
    private List<StepAttachmentResponse> attachments = List.of();
}
