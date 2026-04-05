package com.thulirix.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thulirix.domain.entity.*;
import com.thulirix.domain.enums.AutomationStatus;
import com.thulirix.domain.enums.Priority;
import com.thulirix.domain.enums.TestCaseStatus;
import com.thulirix.dto.request.CreateTestCaseRequest;
import com.thulirix.dto.request.UpdateTestCaseRequest;
import com.thulirix.dto.response.*;
import com.thulirix.exception.ResourceNotFoundException;
import com.thulirix.exception.ValidationException;
import com.thulirix.repository.*;
import com.thulirix.dto.response.StepAttachmentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TestCaseService {

    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;
    private final TestCaseVersionRepository versionRepository;
    private final TagRepository tagRepository;
    private final ProjectRepository projectRepository;
    private final StepAttachmentRepository stepAttachmentRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PageResponse<TestCaseSummaryResponse> getTestCases(
            UUID projectId, String q, String status, String priority,
            String automationStatus, Pageable pageable) {

        Page<TestCase> page;
        if (q == null && status == null && priority == null && automationStatus == null) {
            page = testCaseRepository.findByProjectIdAndDeletedFalse(projectId, pageable);
        } else {
            page = testCaseRepository.searchTestCases(projectId, q, status, priority, automationStatus, pageable);
        }
        return PageResponse.from(page, this::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public TestCaseResponse getTestCase(UUID projectId, UUID testCaseId) {
        TestCase testCase = findTestCase(projectId, testCaseId);
        return toFullResponse(testCase);
    }

    public TestCaseResponse createTestCase(UUID projectId, CreateTestCaseRequest request, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        String tcKey = generateTcKey(projectId);

        TestCase testCase = TestCase.builder()
                .project(project)
                .tcKey(tcKey)
                .title(request.getTitle())
                .description(request.getDescription())
                .objective(request.getObjective())
                .preconditions(request.getPreconditions())
                .postconditions(request.getPostconditions())
                .status(request.getStatus() != null ? request.getStatus() : TestCaseStatus.DRAFT)
                .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
                .automationStatus(request.getAutomationStatus() != null
                        ? request.getAutomationStatus() : AutomationStatus.NOT_AUTOMATED)
                .automationMetadata(request.getAutomationMetadata())
                .currentVersion(1)
                .deleted(false)
                .build();

        // Attach tags
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findByIdInAndProjectId(request.getTagIds(), projectId);
            testCase.setTags(new HashSet<>(tags));
        }

        testCase = testCaseRepository.save(testCase);

        // Add steps
        if (request.getSteps() != null && !request.getSteps().isEmpty()) {
            List<TestStep> steps = buildSteps(testCase, request.getSteps());
            testStepRepository.saveAll(steps);
            testCase.setSteps(steps);
        }

        // Create version snapshot v1
        createVersionSnapshot(testCase, 1, "Initial version", userId);

        log.info("TestCase {} ({}) created in project {}", tcKey, testCase.getId(), projectId);
        return toFullResponse(testCase);
    }

    public TestCaseResponse updateTestCase(
            UUID projectId, UUID testCaseId, UpdateTestCaseRequest request, UUID userId) {

        TestCase testCase = findTestCase(projectId, testCaseId);

        if (request.getTitle() != null) testCase.setTitle(request.getTitle());
        if (request.getDescription() != null) testCase.setDescription(request.getDescription());
        if (request.getObjective() != null) testCase.setObjective(request.getObjective());
        if (request.getPreconditions() != null) testCase.setPreconditions(request.getPreconditions());
        if (request.getPostconditions() != null) testCase.setPostconditions(request.getPostconditions());
        if (request.getStatus() != null) testCase.setStatus(request.getStatus());
        if (request.getPriority() != null) testCase.setPriority(request.getPriority());
        if (request.getAutomationStatus() != null) testCase.setAutomationStatus(request.getAutomationStatus());
        if (request.getAutomationMetadata() != null) testCase.setAutomationMetadata(request.getAutomationMetadata());

        // Update tags
        if (request.getTagIds() != null) {
            List<Tag> tags = tagRepository.findByIdInAndProjectId(request.getTagIds(), projectId);
            testCase.setTags(new HashSet<>(tags));
        }

        // Update steps - delete old, insert new
        if (request.getSteps() != null) {
            testStepRepository.deleteByTestCaseId(testCaseId);
            testCase.getSteps().clear();
            List<TestStep> newSteps = buildStepsFromUpdate(testCase, request.getSteps());
            testStepRepository.saveAll(newSteps);
            testCase.getSteps().addAll(newSteps);
        }

        int newVersion = testCase.getCurrentVersion() + 1;
        testCase.setCurrentVersion(newVersion);

        testCase = testCaseRepository.save(testCase);
        createVersionSnapshot(testCase, newVersion,
                request.getChangeSummary() != null ? request.getChangeSummary() : "Updated", userId);

        log.info("TestCase {} updated to version {} in project {}", testCaseId, newVersion, projectId);
        return toFullResponse(testCase);
    }

    public void deleteTestCase(UUID projectId, UUID testCaseId) {
        TestCase testCase = findTestCase(projectId, testCaseId);
        testCase.setDeleted(true);
        testCaseRepository.save(testCase);
        log.info("TestCase {} soft-deleted from project {}", testCaseId, projectId);
    }

    public void archiveTestCase(UUID projectId, UUID testCaseId) {
        TestCase testCase = findTestCase(projectId, testCaseId);
        testCase.setStatus(TestCaseStatus.ARCHIVED);
        testCaseRepository.save(testCase);
        log.info("TestCase {} archived in project {}", testCaseId, projectId);
    }

    public TestCaseResponse restoreVersion(UUID projectId, UUID testCaseId, int versionNum, UUID userId) {
        TestCase testCase = findTestCase(projectId, testCaseId);

        TestCaseVersion version = versionRepository
                .findByTestCaseIdAndVersionNumber(testCaseId, versionNum)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Version " + versionNum + " not found for test case " + testCaseId));

        testCase.setTitle(version.getTitle());
        testCase.setObjective(version.getObjective());
        testCase.setPreconditions(version.getPreconditions());
        testCase.setPostconditions(version.getPostconditions());
        testCase.setStatus(version.getStatus());
        testCase.setPriority(version.getPriority());

        // Restore steps from snapshot
        if (version.getStepsSnapshot() != null) {
            try {
                List<StepSnapshot> snapshotSteps = objectMapper.readValue(version.getStepsSnapshot(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, StepSnapshot.class));
                testStepRepository.deleteByTestCaseId(testCaseId);
                testCase.getSteps().clear();
                List<TestStep> restoredSteps = new ArrayList<>();
                for (int i = 0; i < snapshotSteps.size(); i++) {
                    StepSnapshot snap = snapshotSteps.get(i);
                    TestStep step = TestStep.builder()
                            .testCase(testCase)
                            .stepOrder(i + 1)
                            .action(snap.getAction())
                            .expectedResult(snap.getExpectedResult())
                            .testData(snap.getTestData())
                            .build();
                    restoredSteps.add(step);
                }
                testStepRepository.saveAll(restoredSteps);
                testCase.getSteps().addAll(restoredSteps);
            } catch (JsonProcessingException e) {
                log.error("Failed to deserialize steps snapshot for version {}: {}", versionNum, e.getMessage());
                throw new ValidationException("Could not restore steps from version snapshot");
            }
        }

        int newVersion = testCase.getCurrentVersion() + 1;
        testCase.setCurrentVersion(newVersion);
        testCase = testCaseRepository.save(testCase);

        createVersionSnapshot(testCase, newVersion, "Restored from version " + versionNum, userId);
        log.info("TestCase {} restored to version {} in project {}", testCaseId, versionNum, projectId);
        return toFullResponse(testCase);
    }

    @Transactional(readOnly = true)
    public List<TestCaseVersionSummary> getVersionHistory(UUID projectId, UUID testCaseId) {
        findTestCase(projectId, testCaseId); // validate access
        return versionRepository.findByTestCaseIdOrderByVersionNumberDesc(testCaseId)
                .stream()
                .map(v -> TestCaseVersionSummary.builder()
                        .id(v.getId())
                        .versionNumber(v.getVersionNumber())
                        .title(v.getTitle())
                        .status(v.getStatus())
                        .priority(v.getPriority())
                        .changeSummary(v.getChangeSummary())
                        .createdBy(v.getCreatedBy())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private String generateTcKey(UUID projectId) {
        int nextNum = testCaseRepository.findMaxTcKey(projectId).map(n -> n + 1).orElse(1);
        return "TC-" + String.format("%04d", nextNum);
    }

    private TestCase findTestCase(UUID projectId, UUID testCaseId) {
        return testCaseRepository.findById(testCaseId)
                .filter(tc -> tc.getProject().getId().equals(projectId) && !tc.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", testCaseId));
    }

    private List<TestStep> buildSteps(TestCase testCase, List<CreateTestCaseRequest.StepRequest> stepRequests) {
        List<TestStep> steps = new ArrayList<>();
        for (int i = 0; i < stepRequests.size(); i++) {
            CreateTestCaseRequest.StepRequest req = stepRequests.get(i);
            steps.add(TestStep.builder()
                    .testCase(testCase)
                    .stepOrder(i + 1)
                    .action(req.getAction())
                    .expectedResult(req.getExpectedResult())
                    .testData(req.getTestData())
                    .build());
        }
        return steps;
    }

    private List<TestStep> buildStepsFromUpdate(TestCase testCase, List<UpdateTestCaseRequest.StepRequest> stepRequests) {
        List<TestStep> steps = new ArrayList<>();
        for (int i = 0; i < stepRequests.size(); i++) {
            UpdateTestCaseRequest.StepRequest req = stepRequests.get(i);
            steps.add(TestStep.builder()
                    .testCase(testCase)
                    .stepOrder(i + 1)
                    .action(req.getAction())
                    .expectedResult(req.getExpectedResult())
                    .testData(req.getTestData())
                    .build());
        }
        return steps;
    }

    private void createVersionSnapshot(TestCase testCase, int versionNumber, String changeSummary, UUID createdBy) {
        List<StepSnapshot> snapshots = testCase.getSteps().stream()
                .map(s -> new StepSnapshot(s.getStepOrder(), s.getAction(), s.getExpectedResult(), s.getTestData()))
                .collect(Collectors.toList());

        String stepsJson;
        try {
            stepsJson = objectMapper.writeValueAsString(snapshots);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize steps for version snapshot: {}", e.getMessage());
            stepsJson = "[]";
        }

        TestCaseVersion version = TestCaseVersion.builder()
                .testCase(testCase)
                .versionNumber(versionNumber)
                .title(testCase.getTitle())
                .objective(testCase.getObjective())
                .preconditions(testCase.getPreconditions())
                .postconditions(testCase.getPostconditions())
                .status(testCase.getStatus())
                .priority(testCase.getPriority())
                .stepsSnapshot(stepsJson)
                .changeSummary(changeSummary)
                .createdBy(createdBy)
                .build();

        versionRepository.save(version);
    }

    private TestCaseResponse toFullResponse(TestCase testCase) {
        List<StepResponse> stepResponses = testCase.getSteps().stream()
                .sorted(Comparator.comparingInt(TestStep::getStepOrder))
                .map(s -> {
                    List<StepAttachmentResponse> attachments = stepAttachmentRepository
                            .findByTestStepIdOrderByCreatedAtAsc(s.getId())
                            .stream()
                            .map(a -> StepAttachmentResponse.builder()
                                    .id(a.getId())
                                    .testStepId(s.getId())
                                    .originalName(a.getOriginalName())
                                    .mimeType(a.getMimeType())
                                    .fileSize(a.getFileSize())
                                    .createdAt(a.getCreatedAt())
                                    .downloadUrl("/api/v1/attachments/" + a.getId() + "/file")
                                    .build())
                            .collect(Collectors.toList());
                    return StepResponse.builder()
                            .id(s.getId())
                            .stepOrder(s.getStepOrder())
                            .action(s.getAction())
                            .expectedResult(s.getExpectedResult())
                            .testData(s.getTestData())
                            .sharedStep(s.isSharedStep())
                            .attachments(attachments)
                            .build();
                })
                .collect(Collectors.toList());

        Set<TagResponse> tagResponses = testCase.getTags().stream()
                .map(t -> TagResponse.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .colorHex(t.getColorHex())
                        .projectId(t.getProject().getId())
                        .build())
                .collect(Collectors.toSet());

        return TestCaseResponse.builder()
                .id(testCase.getId())
                .tcKey(testCase.getTcKey())
                .title(testCase.getTitle())
                .description(testCase.getDescription())
                .objective(testCase.getObjective())
                .preconditions(testCase.getPreconditions())
                .postconditions(testCase.getPostconditions())
                .status(testCase.getStatus())
                .priority(testCase.getPriority())
                .automationStatus(testCase.getAutomationStatus())
                .automationMetadata(testCase.getAutomationMetadata())
                .estimatedDurationMin(testCase.getEstimatedDurationMin())
                .externalTcId(testCase.getExternalTcId())
                .currentVersion(testCase.getCurrentVersion())
                .deleted(testCase.isDeleted())
                .steps(stepResponses)
                .tags(tagResponses)
                .createdAt(testCase.getCreatedAt())
                .updatedAt(testCase.getUpdatedAt())
                .build();
    }

    private TestCaseSummaryResponse toSummaryResponse(TestCase testCase) {
        List<TagResponse> tags = testCase.getTags().stream()
                .sorted(Comparator.comparing(Tag::getName))
                .map(t -> TagResponse.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .colorHex(t.getColorHex())
                        .projectId(t.getProject().getId())
                        .build())
                .collect(Collectors.toList());
        return TestCaseSummaryResponse.builder()
                .id(testCase.getId())
                .tcKey(testCase.getTcKey())
                .title(testCase.getTitle())
                .status(testCase.getStatus())
                .priority(testCase.getPriority())
                .automationStatus(testCase.getAutomationStatus())
                .tags(tags)
                .createdAt(testCase.getCreatedAt())
                .updatedAt(testCase.getUpdatedAt())
                .build();
    }

    // Inner helper class for step serialization
    private static class StepSnapshot {
        private int stepOrder;
        private String action;
        private String expectedResult;
        private String testData;

        public StepSnapshot() {}

        public StepSnapshot(int stepOrder, String action, String expectedResult, String testData) {
            this.stepOrder = stepOrder;
            this.action = action;
            this.expectedResult = expectedResult;
            this.testData = testData;
        }

        public int getStepOrder() { return stepOrder; }
        public String getAction() { return action; }
        public String getExpectedResult() { return expectedResult; }
        public String getTestData() { return testData; }

        public void setStepOrder(int stepOrder) { this.stepOrder = stepOrder; }
        public void setAction(String action) { this.action = action; }
        public void setExpectedResult(String expectedResult) { this.expectedResult = expectedResult; }
        public void setTestData(String testData) { this.testData = testData; }
    }
}
