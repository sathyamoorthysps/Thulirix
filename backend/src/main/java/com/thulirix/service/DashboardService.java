package com.thulirix.service;

import com.thulirix.domain.enums.AutomationStatus;
import com.thulirix.domain.enums.ExecutionResult;
import com.thulirix.domain.enums.TestCaseStatus;
import com.thulirix.dto.response.DashboardResponse;
import com.thulirix.dto.response.TestRunResponse;
import com.thulirix.exception.ResourceNotFoundException;
import com.thulirix.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TestCaseRepository testCaseRepository;
    private final ExecutionRepository executionRepository;
    private final TestRunRepository testRunRepository;
    private final TestPlanRepository testPlanRepository;

    public DashboardResponse getDashboard(UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        // Test case counts
        long totalTestCases = testCaseRepository.countByProjectIdAndDeletedFalse(projectId);
        long activeTestCases = testCaseRepository.countByProjectIdAndStatusAndDeletedFalse(
                projectId, TestCaseStatus.READY);
        long automatedTestCases = testCaseRepository
                .countByProjectIdAndAutomationStatusNotAndDeletedFalse(projectId, AutomationStatus.NOT_AUTOMATED);

        // Execution counts for last 30 days
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        long totalExecutions = executionRepository.countByProjectIdSince(projectId, thirtyDaysAgo);
        long passCount = executionRepository.countByProjectIdAndResultSince(projectId, ExecutionResult.PASS, thirtyDaysAgo);
        long failCount = executionRepository.countByProjectIdAndResultSince(projectId, ExecutionResult.FAIL, thirtyDaysAgo);
        long blockedCount = executionRepository.countByProjectIdAndResultSince(projectId, ExecutionResult.BLOCKED, thirtyDaysAgo);
        long skippedCount = executionRepository.countByProjectIdAndResultSince(projectId, ExecutionResult.SKIPPED, thirtyDaysAgo);

        Double passRate = totalExecutions > 0
                ? Math.round((passCount * 100.0 / totalExecutions) * 100.0) / 100.0
                : null;

        Double automatedPercentage = totalTestCases > 0
                ? Math.round((automatedTestCases * 100.0 / totalTestCases) * 100.0) / 100.0
                : 0.0;

        // Status breakdown
        List<Object[]> statusRows = testCaseRepository.countByStatusForProject(projectId);
        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        for (Object[] row : statusRows) {
            statusBreakdown.put(row[0].toString(), toLong(row[1]));
        }

        // Recent runs (5 most recent)
        var recentRunsPage = testRunRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<TestRunResponse> recentRuns = recentRunsPage.getContent().stream()
                .filter(r -> r.getPlan().getProject().getId().equals(projectId))
                .map(run -> TestRunResponse.builder()
                        .id(run.getId())
                        .planId(run.getPlan().getId())
                        .name(run.getName())
                        .triggerType(run.getTriggerType())
                        .environment(run.getEnvironment())
                        .buildVersion(run.getBuildVersion())
                        .startedAt(run.getStartedAt())
                        .completedAt(run.getCompletedAt())
                        .totalCount(run.getTotalCount())
                        .passedCount(run.getPassedCount())
                        .failedCount(run.getFailedCount())
                        .blockedCount(run.getBlockedCount())
                        .skippedCount(run.getSkippedCount())
                        .build())
                .collect(Collectors.toList());

        // 14-day trend
        Instant fourteenDaysAgo = Instant.now().minus(14, ChronoUnit.DAYS);
        List<Object[]> rawTrend = executionRepository.getDailyTrendSince(projectId, fourteenDaysAgo);
        List<DashboardResponse.TrendPoint> trendData = rawTrend.stream()
                .map(row -> {
                    LocalDate date = toLocalDate(row[0]);
                    long trendPassed = toLong(row[1]);
                    long trendFailed = toLong(row[2]);
                    long trendTotal = toLong(row[3]);
                    return DashboardResponse.TrendPoint.builder()
                            .date(date)
                            .passed(trendPassed)
                            .failed(trendFailed)
                            .total(trendTotal)
                            .build();
                })
                .collect(Collectors.toList());

        // Fill in missing days with zeros
        trendData = fillMissingDays(trendData, 14);

        return DashboardResponse.builder()
                .totalTestCases(totalTestCases)
                .activeTestCases(activeTestCases)
                .automatedTestCases(automatedTestCases)
                .automatedPercentage(automatedPercentage)
                .totalExecutions(totalExecutions)
                .passRate(passRate)
                .passCount(passCount)
                .failCount(failCount)
                .blockedCount(blockedCount)
                .skippedCount(skippedCount)
                .statusBreakdown(statusBreakdown)
                .recentRuns(recentRuns)
                .trendData(trendData)
                .build();
    }

    private LocalDate toLocalDate(Object obj) {
        if (obj instanceof Date d) return d.toLocalDate();
        if (obj instanceof LocalDate ld) return ld;
        if (obj instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
        return LocalDate.now();
    }

    private long toLong(Object obj) {
        if (obj == null) return 0L;
        if (obj instanceof Long l) return l;
        if (obj instanceof BigInteger bi) return bi.longValue();
        if (obj instanceof BigDecimal bd) return bd.longValue();
        if (obj instanceof Number n) return n.longValue();
        return 0L;
    }

    private List<DashboardResponse.TrendPoint> fillMissingDays(
            List<DashboardResponse.TrendPoint> data, int days) {

        var dataMap = data.stream()
                .collect(Collectors.toMap(DashboardResponse.TrendPoint::getDate, tp -> tp));

        List<DashboardResponse.TrendPoint> filled = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            filled.add(dataMap.getOrDefault(date, DashboardResponse.TrendPoint.builder()
                    .date(date)
                    .passed(0)
                    .failed(0)
                    .total(0)
                    .build()));
        }
        return filled;
    }
}
