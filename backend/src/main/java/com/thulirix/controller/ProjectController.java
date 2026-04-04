package com.thulirix.controller;

import com.thulirix.domain.enums.Role;
import com.thulirix.dto.request.AddMemberRequest;
import com.thulirix.dto.request.CreateProjectRequest;
import com.thulirix.dto.request.UpdateProjectRequest;
import com.thulirix.dto.response.PageResponse;
import com.thulirix.dto.response.ProjectResponse;
import com.thulirix.security.UserPrincipal;
import com.thulirix.service.ProjectService;
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

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<PageResponse<ProjectResponse>> getProjects(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UserPrincipal principal = getCurrentUser();
        return ResponseEntity.ok(projectService.getProjectsForUser(principal.getId(), pageable));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request) {
        UserPrincipal principal = getCurrentUser();
        ProjectResponse response = projectService.createProject(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID projectId) {
        UserPrincipal principal = getCurrentUser();
        return ResponseEntity.ok(projectService.getProject(projectId, principal.getId()));
    }

    @PatchMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(projectId, request));
    }

    @DeleteMapping("/{projectId}/archive")
    public ResponseEntity<Void> archiveProject(@PathVariable UUID projectId) {
        projectService.archiveProject(projectId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<Void> addMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody AddMemberRequest request) {
        UserPrincipal principal = getCurrentUser();
        projectService.addMember(projectId, request.getUserId(), request.getRole(), principal.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "TESTER") Role role) {
        projectService.removeMember(projectId, userId, role);
        return ResponseEntity.noContent().build();
    }

    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
