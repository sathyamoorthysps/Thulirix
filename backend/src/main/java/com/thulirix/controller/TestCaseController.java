package com.thulirix.controller;

import com.thulirix.dto.request.CreateTestCaseRequest;
import com.thulirix.dto.request.UpdateTestCaseRequest;
import com.thulirix.dto.response.PageResponse;
import com.thulirix.dto.response.TestCaseResponse;
import com.thulirix.dto.response.TestCaseSummaryResponse;
import com.thulirix.dto.response.TestCaseVersionSummary;
import com.thulirix.security.UserPrincipal;
import com.thulirix.service.TestCaseService;
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
@RequestMapping("/api/v1/projects/{projectId}/test-cases")
@RequiredArgsConstructor
public class TestCaseController {

    private final TestCaseService testCaseService;

    @GetMapping
    public ResponseEntity<PageResponse<TestCaseSummaryResponse>> getTestCases(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String automationStatus,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                testCaseService.getTestCases(projectId, q, status, priority, automationStatus, pageable));
    }

    @PostMapping
    public ResponseEntity<TestCaseResponse> createTestCase(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTestCaseRequest request) {
        UserPrincipal principal = getCurrentUser();
        TestCaseResponse response = testCaseService.createTestCase(projectId, request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{testCaseId}")
    public ResponseEntity<TestCaseResponse> getTestCase(
            @PathVariable UUID projectId,
            @PathVariable UUID testCaseId) {
        return ResponseEntity.ok(testCaseService.getTestCase(projectId, testCaseId));
    }

    @PutMapping("/{testCaseId}")
    public ResponseEntity<TestCaseResponse> updateTestCase(
            @PathVariable UUID projectId,
            @PathVariable UUID testCaseId,
            @Valid @RequestBody UpdateTestCaseRequest request) {
        UserPrincipal principal = getCurrentUser();
        return ResponseEntity.ok(
                testCaseService.updateTestCase(projectId, testCaseId, request, principal.getId()));
    }

    @DeleteMapping("/{testCaseId}")
    public ResponseEntity<Void> deleteTestCase(
            @PathVariable UUID projectId,
            @PathVariable UUID testCaseId) {
        testCaseService.deleteTestCase(projectId, testCaseId);
        return ResponseEntity.noContent().build();
    }

    @RequestMapping(value = "/{testCaseId}/archive", method = {RequestMethod.POST, RequestMethod.PATCH})
    public ResponseEntity<Void> archiveTestCase(
            @PathVariable UUID projectId,
            @PathVariable UUID testCaseId) {
        testCaseService.archiveTestCase(projectId, testCaseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{testCaseId}/versions")
    public ResponseEntity<List<TestCaseVersionSummary>> getVersionHistory(
            @PathVariable UUID projectId,
            @PathVariable UUID testCaseId) {
        return ResponseEntity.ok(testCaseService.getVersionHistory(projectId, testCaseId));
    }

    @PostMapping({"/{testCaseId}/restore/{versionNum}", "/{testCaseId}/versions/{versionNum}/restore"})
    public ResponseEntity<TestCaseResponse> restoreVersion(
            @PathVariable UUID projectId,
            @PathVariable UUID testCaseId,
            @PathVariable int versionNum) {
        UserPrincipal principal = getCurrentUser();
        return ResponseEntity.ok(
                testCaseService.restoreVersion(projectId, testCaseId, versionNum, principal.getId()));
    }

    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
