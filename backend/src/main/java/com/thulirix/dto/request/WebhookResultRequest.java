package com.thulirix.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class WebhookResultRequest {

    private String source;

    private String runReference;

    private String projectSlug;

    private String buildVersion;

    private String environment;

    private List<WebhookTestResult> results;

    @Data
    public static class WebhookTestResult {

        private String externalTcId;

        private String result;

        private Long durationMs;

        private String automationTool;

        private String output;
    }
}
