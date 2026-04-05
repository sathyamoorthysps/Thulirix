package com.thulirix.service;

import com.thulirix.domain.entity.*;
import com.thulirix.domain.enums.ExecutionResult;
import com.thulirix.domain.enums.RunTrigger;
import com.thulirix.dto.request.CreateTestPlanRequest;
import com.thulirix.dto.request.CreateTestRunRequest;
import com.thulirix.dto.request.UpdateExecutionRequest;
import com.thulirix.dto.request.UpdateTestPlanRequest;
import com.thulirix.dto.request.UpdateTestRunRequest;
import com.thulirix.dto.request.WebhookResultRequest;
import com.thulirix.dto.response.*;
import com.thulirix.exception.ResourceNotFoundException;
import com.thulirix.exception.ValidationException;
import com.thulirix.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ExecutionService {

    private final TestPlanRepository testPlanRepository;
    private final TestRunRepository testRunRepository;
    private final ExecutionRepository executionRepository;
    private final TestCaseRepository testCaseRepository;
    private final ProjectRepository projectRepository;

    public TestPlanResponse createPlan(UUID projectId, CreateTestPlanRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        TestPlan plan = TestPlan.builder()
                .project(project)
                .name(request.getName())
                .description(request.getDescription())
                .environment(request.getEnvironment())
                .buildVersion(request.getBuildVersion())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status("DRAFT")
                .build();

        plan = testPlanRepository.save(plan);

        if (request.getTestCaseIds() != null && !request.getTestCaseIds().isEmpty()) {
            List<TestCase> testCases = testCaseRepository.findAllById(request.getTestCaseIds()).stream()
                    .filter(tc -> tc.getProject().getId().equals(projectId) && !tc.isDeleted())
                    .collect(Collectors.toList());
            for (TestCase tc : testCases) {
                plan.getPlanCases().add(TestPlanCase.builder()
                        .testPlan(plan)
                        .testCase(tc)
                        .tcVersion(tc.getCurrentVersion())
                        .build());
            }
            plan = testPlanRepository.save(plan);
        }

        log.info("TestPlan '{}' created in project {} with {} cases",
                plan.getName(), projectId, plan.getPlanCases().size());
        return toPlanResponse(plan);
    }

    @Transactional(readOnly = true)
    public PageResponse<TestPlanResponse> getPlans(UUID projectId, Pageable pageable) {
        Page<TestPlan> page = testPlanRepository.findByProjectId(projectId, pageable);
        return PageResponse.from(page, this::toPlanResponse);
    }

    @Transactional(readOnly = true)
    public TestPlanResponse getPlan(UUID projectId, UUID planId) {
        TestPlan plan = testPlanRepository.findByProjectIdAndId(projectId, planId)
                .orElseThrow(() -> new ResourceNotFoundException("TestPlan", planId));
        return toPlanResponse(plan);
    }

    public TestPlanResponse updatePlan(UUID projectId, UUID planId, UpdateTestPlanRequest request) {
        TestPlan plan = testPlanRepository.findByProjectIdAndId(projectId, planId)
                .orElseThrow(() -> new ResourceNotFoundException("TestPlan", planId));
        plan.setName(request.getName());
        if (request.getDescription() != null) plan.setDescription(request.getDescription());

        if (request.getTestCaseIds() != null) {
            // Clear existing entries; orphanRemoval=true will delete them on flush
            plan.getPlanCases().clear();

            if (!request.getTestCaseIds().isEmpty()) {
                List<TestCase> testCases = testCaseRepository.findAllById(request.getTestCaseIds()).stream()
                        .filter(tc -> tc.getProject().getId().equals(projectId) && !tc.isDeleted())
                        .collect(Collectors.toList());
                for (TestCase tc : testCases) {
                    plan.getPlanCases().add(TestPlanCase.builder()
                            .testPlan(plan)
                            .testCase(tc)
                            .tcVersion(tc.getCurrentVersion())
                            .build());
                }
            }
        }

        plan = testPlanRepository.save(plan);
        log.info("TestPlan {} updated with {} cases", planId, plan.getPlanCases().size());
        return toPlanResponse(plan);
    }

    public TestRunResponse updateRun(UUID projectId, UUID planId, UUID runId, UpdateTestRunRequest request) {
        testPlanRepository.findByProjectIdAndId(projectId, planId)
                .orElseThrow(() -> new ResourceNotFoundException("TestPlan", planId));
        TestRun run = testRunRepository.findById(runId)
                .filter(r -> r.getPlan().getId().equals(planId))
                .orElseThrow(() -> new ResourceNotFoundException("TestRun", runId));
        run.setName(request.getName());
        if (request.getEnvironment() != null) run.setEnvironment(request.getEnvironment());
        if (request.getBuildVersion() != null) run.setBuildVersion(request.getBuildVersion());
        run = testRunRepository.save(run);
        log.info("TestRun {} updated", runId);
        return toRunResponse(run);
    }

    public TestRunResponse createRun(UUID projectId, UUID planId, CreateTestRunRequest request, UUID userId) {
        TestPlan plan = testPlanRepository.findByProjectIdAndId(projectId, planId)
                .orElseThrow(() -> new ResourceNotFoundException("TestPlan", planId));

        TestRun run = TestRun.builder()
                .plan(plan)
                .name(request.getName())
                .triggerType(RunTrigger.MANUAL)
                .environment(request.getEnvironment())
                .buildVersion(request.getBuildVersion())
                .startedAt(Instant.now())
                .totalCount(0)
                .passedCount(0)
                .failedCount(0)
                .blockedCount(0)
                .skippedCount(0)
                .build();

        run = testRunRepository.save(run);

        List<TestCase> testCases;
        if (request.getTestCaseIds() != null && !request.getTestCaseIds().isEmpty()) {
            testCases = testCaseRepository.findAllById(request.getTestCaseIds()).stream()
                    .filter(tc -> tc.getProject().getId().equals(projectId) && !tc.isDeleted())
                    .collect(Collectors.toList());
        } else {
            // Use all test cases from the plan
            testCases = plan.getPlanCases().stream()
                    .map(TestPlanCase::getTestCase)
                    .filter(tc -> !tc.isDeleted())
                    .collect(Collectors.toList());
        }

        List<Execution> executions = new ArrayList<>();
        for (TestCase tc : testCases) {
            Execution exec = Execution.builder()
                    .run(run)
                    .testCase(tc)
                    .tcVersion(tc.getCurrentVersion())
                    .result(ExecutionResult.PENDING)
                    .environment(request.getEnvironment())
                    .automated(false)
                    .build();
            executions.add(exec);
        }

        executionRepository.saveAll(executions);

        run.setTotalCount(executions.size());
        run = testRunRepository.save(run);

        log.info("TestRun '{}' created in plan {} with {} executions", run.getName(), planId, executions.size());
        return toRunResponse(run);
    }

    @Transactional(readOnly = true)
    public PageResponse<TestRunResponse> getRuns(UUID projectId, UUID planId, Pageable pageable) {
        // Validate plan belongs to project
        testPlanRepository.findByProjectIdAndId(projectId, planId)
                .orElseThrow(() -> new ResourceNotFoundException("TestPlan", planId));
        Page<TestRun> page = testRunRepository.findByPlanId(planId, pageable);
        return PageResponse.from(page, this::toRunResponse);
    }

    @Transactional(readOnly = true)
    public TestRunResponse getRun(UUID projectId, UUID runId) {
        TestRun run = testRunRepository.findById(runId)
                .filter(r -> r.getPlan().getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("TestRun", runId));
        return toRunResponse(run);
    }

    @Transactional(readOnly = true)
    public List<ExecutionResponse> getExecutions(UUID projectId, UUID runId) {
        TestRun run = testRunRepository.findById(runId)
                .filter(r -> r.getPlan().getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("TestRun", runId));

        return executionRepository.findByRunId(runId).stream()
                .map(this::toExecutionResponse)
                .collect(Collectors.toList());
    }

    public ExecutionResponse updateExecution(
            UUID projectId, UUID runId, UUID execId,
            UpdateExecutionRequest req, UUID userId) {

        Execution execution = executionRepository.findById(execId)
                .filter(e -> e.getRun().getId().equals(runId)
                        && e.getRun().getPlan().getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Execution", execId));

        ExecutionResult previousResult = execution.getResult();
        execution.setResult(req.getResult());
        if (req.getNotes() != null) execution.setNotes(req.getNotes());
        if (req.getDefectIds() != null) execution.setDefectIds(req.getDefectIds());
        if (req.getAutomationOutput() != null) {
            execution.setAutomationOutput(req.getAutomationOutput());
            execution.setAutomated(true);
        }
        if (req.getDurationMs() != null) execution.setDurationMs(req.getDurationMs());

        if (execution.getStartedAt() == null) {
            execution.setStartedAt(Instant.now());
        }
        if (req.getResult() != ExecutionResult.PENDING && req.getResult() != ExecutionResult.NOT_RUN) {
            execution.setCompletedAt(Instant.now());
        }

        execution = executionRepository.save(execution);
        log.info("Execution {} updated to result {} in run {}", execId, req.getResult(), runId);

        // Recalculate run counters
        recalculateRunCounters(execution.getRun());

        return toExecutionResponse(execution);
    }

    @Async("taskExecutor")
    public void processWebhookResults(WebhookResultRequest request) {
        try {
            Project project = projectRepository.findBySlug(request.getProjectSlug())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Project not found with slug: " + request.getProjectSlug()));

            // Find the latest open run or create a new one
            Pageable latestRunPage = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt"));
            List<TestPlan> plans = testPlanRepository.findByProjectId(project.getId(),
                    PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();

            if (plans.isEmpty()) {
                log.warn("No test plans found for project {} during webhook processing", request.getProjectSlug());
                return;
            }

            TestPlan latestPlan = plans.get(0);
            Page<TestRun> recentRuns = testRunRepository.findByPlanId(
                    latestPlan.getId(), latestRunPage);

            TestRun run;
            if (!recentRuns.isEmpty()) {
                run = recentRuns.getContent().get(0);
            } else {
                run = TestRun.builder()
                        .plan(latestPlan)
                        .name("Webhook Run - " + (request.getBuildVersion() != null ? request.getBuildVersion() : Instant.now()))
                        .triggerType(RunTrigger.CI_CD_WEBHOOK)
                        .environment(request.getEnvironment())
                        .buildVersion(request.getBuildVersion())
                        .startedAt(Instant.now())
                        .totalCount(0)
                        .passedCount(0)
                        .failedCount(0)
                        .blockedCount(0)
                        .skippedCount(0)
                        .build();
                run = testRunRepository.save(run);
            }

            if (request.getResults() == null || request.getResults().isEmpty()) {
                return;
            }

            final TestRun finalRun = run;
            for (WebhookResultRequest.WebhookTestResult webhookResult : request.getResults()) {
                // Match by externalTcId first, then by TC key
                Optional<TestCase> tcOpt = Optional.empty();
                if (webhookResult.getExternalTcId() != null) {
                    tcOpt = testCaseRepository.findByProjectIdAndTcKeyAndDeletedFalse(
                            project.getId(), webhookResult.getExternalTcId());
                }
                if (tcOpt.isEmpty() && webhookResult.getExternalTcId() != null) {
                    // Try finding by externalTcId field
                    tcOpt = testCaseRepository.findByProjectIdAndDeletedFalse(project.getId(), Pageable.unpaged())
                            .getContent().stream()
                            .filter(tc -> webhookResult.getExternalTcId().equals(tc.getExternalTcId()))
                            .findFirst();
                }

                if (tcOpt.isEmpty()) {
                    log.warn("No test case found for externalTcId {} in project {}",
                            webhookResult.getExternalTcId(), request.getProjectSlug());
                    continue;
                }

                TestCase tc = tcOpt.get();
                ExecutionResult result = mapStringToResult(webhookResult.getResult());

                Optional<Execution> existingExec = executionRepository.findByRunIdAndTestCaseId(finalRun.getId(), tc.getId());
                Execution execution;
                if (existingExec.isPresent()) {
                    execution = existingExec.get();
                } else {
                    execution = Execution.builder()
                            .run(finalRun)
                            .testCase(tc)
                            .tcVersion(tc.getCurrentVersion())
                            .result(ExecutionResult.PENDING)
                            .automated(true)
                            .build();
                }

                execution.setResult(result);
                execution.setAutomated(true);
                if (webhookResult.getAutomationTool() != null) {
                    execution.setAutomationTool(webhookResult.getAutomationTool());
                }
                if (webhookResult.getOutput() != null) {
                    execution.setAutomationOutput(webhookResult.getOutput());
                }
                if (webhookResult.getDurationMs() != null) {
                    execution.setDurationMs(webhookResult.getDurationMs().intValue());
                }
                execution.setCompletedAt(Instant.now());
                executionRepository.save(execution);
            }

            recalculateRunCounters(run);
            log.info("Webhook results processed for project {} run {}", request.getProjectSlug(), run.getId());

        } catch (Exception e) {
            log.error("Error processing webhook results for project {}: {}",
                    request.getProjectSlug(), e.getMessage(), e);
        }
    }

    private void recalculateRunCounters(TestRun run) {
        List<Execution> executions = executionRepository.findByRunId(run.getId());

        int total = executions.size();
        int passed = (int) executions.stream().filter(e -> e.getResult() == ExecutionResult.PASS).count();
        int failed = (int) executions.stream().filter(e -> e.getResult() == ExecutionResult.FAIL).count();
        int blocked = (int) executions.stream().filter(e -> e.getResult() == ExecutionResult.BLOCKED).count();
        int skipped = (int) executions.stream().filter(e -> e.getResult() == ExecutionResult.SKIPPED).count();

        run.setTotalCount(total);
        run.setPassedCount(passed);
        run.setFailedCount(failed);
        run.setBlockedCount(blocked);
        run.setSkippedCount(skipped);

        boolean allDone = executions.stream().allMatch(e ->
                e.getResult() != ExecutionResult.PENDING && e.getResult() != ExecutionResult.NOT_RUN);
        if (allDone && run.getCompletedAt() == null) {
            run.setCompletedAt(Instant.now());
        }

        testRunRepository.save(run);
    }

    private ExecutionResult mapStringToResult(String result) {
        if (result == null) return ExecutionResult.NOT_RUN;
        return switch (result.toUpperCase()) {
            case "PASS", "PASSED", "SUCCESS" -> ExecutionResult.PASS;
            case "FAIL", "FAILED", "FAILURE", "ERROR" -> ExecutionResult.FAIL;
            case "BLOCKED" -> ExecutionResult.BLOCKED;
            case "SKIPPED", "SKIP" -> ExecutionResult.SKIPPED;
            default -> ExecutionResult.NOT_RUN;
        };
    }

    private TestPlanResponse toPlanResponse(TestPlan plan) {
        List<UUID> tcIds = plan.getPlanCases() != null
                ? plan.getPlanCases().stream()
                        .map(pc -> pc.getTestCase().getId())
                        .collect(Collectors.toList())
                : List.of();
        return TestPlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .status(plan.getStatus())
                .environment(plan.getEnvironment())
                .buildVersion(plan.getBuildVersion())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .adoPlanId(plan.getAdoPlanId())
                .totalCases(tcIds.size())
                .testCaseIds(tcIds)
                .build();
    }

    private TestRunResponse toRunResponse(TestRun run) {
        return TestRunResponse.builder()
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
                .build();
    }

    private ExecutionResponse toExecutionResponse(Execution execution) {
        return ExecutionResponse.builder()
                .executionId(execution.getId())
                .testCaseId(execution.getTestCase().getId())
                .tcKey(execution.getTestCase().getTcKey())
                .title(execution.getTestCase().getTitle())
                .result(execution.getResult())
                .environment(execution.getEnvironment())
                .assignedTo(execution.getAssignedTo())
                .startedAt(execution.getStartedAt())
                .completedAt(execution.getCompletedAt())
                .durationMs(execution.getDurationMs())
                .notes(execution.getNotes())
                .isAutomated(execution.isAutomated())
                .build();
    }
}
