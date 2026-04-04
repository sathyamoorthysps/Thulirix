package com.thulirix.controller;

import com.thulirix.dto.request.CreateTestPlanRequest;
import com.thulirix.dto.request.CreateTestRunRequest;
import com.thulirix.dto.request.UpdateExecutionRequest;
import com.thulirix.dto.response.*;
import com.thulirix.security.UserPrincipal;
import com.thulirix.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects/{projectId}")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;

    // ---------- Test Plans ----------

    @GetMapping("/test-plans")
    public ResponseEntity<PageResponse<TestPlanResponse>> getPlans(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(executionService.getPlans(projectId, pageable));
    }

    @PostMapping("/test-plans")
    public ResponseEntity<TestPlanResponse> createPlan(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTestPlanRequest request) {
        TestPlanResponse response = executionService.createPlan(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/test-plans/{planId}")
    public ResponseEntity<TestPlanResponse> getPlan(
            @PathVariable UUID projectId,
            @PathVariable UUID planId) {
        return ResponseEntity.ok(executionService.getPlan(projectId, planId));
    }

    // ---------- Test Runs ----------

    @PostMapping("/test-plans/{planId}/runs")
    public ResponseEntity<TestRunResponse> createRun(
            @PathVariable UUID projectId,
            @PathVariable UUID planId,
            @Valid @RequestBody CreateTestRunRequest request) {
        UserPrincipal principal = getCurrentUser();
        TestRunResponse response = executionService.createRun(projectId, planId, request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/test-plans/{planId}/runs")
    public ResponseEntity<PageResponse<TestRunResponse>> getRuns(
            @PathVariable UUID projectId,
            @PathVariable UUID planId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(executionService.getRuns(projectId, planId, pageable));
    }

    @GetMapping("/test-plans/{planId}/runs/{runId}")
    public ResponseEntity<TestRunResponse> getRun(
            @PathVariable UUID projectId,
            @PathVariable UUID planId,
            @PathVariable UUID runId) {
        return ResponseEntity.ok(executionService.getRun(projectId, runId));
    }

    @GetMapping("/test-plans/{planId}/runs/{runId}/executions")
    public ResponseEntity<List<ExecutionResponse>> getExecutions(
            @PathVariable UUID projectId,
            @PathVariable UUID planId,
            @PathVariable UUID runId) {
        return ResponseEntity.ok(executionService.getExecutions(projectId, runId));
    }

    @PutMapping("/test-plans/{planId}/runs/{runId}/executions/{execId}")
    public ResponseEntity<ExecutionResponse> updateExecution(
            @PathVariable UUID projectId,
            @PathVariable UUID planId,
            @PathVariable UUID runId,
            @PathVariable UUID execId,
            @Valid @RequestBody UpdateExecutionRequest request) {
        UserPrincipal principal = getCurrentUser();
        ExecutionResponse response = executionService.updateExecution(
                projectId, runId, execId, request, principal.getId());
        return ResponseEntity.ok(response);
    }

    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
