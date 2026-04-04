package com.thulirix.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardResponse {

    private long totalTestCases;
    private long activeTestCases;
    private long automatedTestCases;
    private long totalExecutions;

    private Double passRate;
    private Double automatedPercentage;
    private long passCount;
    private long failCount;
    private long blockedCount;
    private long skippedCount;

    private Map<String, Long> statusBreakdown;

    private List<TestRunResponse> recentRuns;

    @JsonProperty("trend")
    private List<TrendPoint> trendData;

    @Data
    @Builder
    public static class TrendPoint {
        private LocalDate date;
        private long passed;
        private long failed;
        private long total;
    }
}
