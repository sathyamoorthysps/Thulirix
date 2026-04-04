package com.thulirix.service;

import com.thulirix.domain.entity.Project;
import com.thulirix.domain.entity.User;
import com.thulirix.domain.entity.UserProjectRole;
import com.thulirix.domain.enums.Role;
import com.thulirix.dto.request.CreateProjectRequest;
import com.thulirix.dto.request.UpdateProjectRequest;
import com.thulirix.dto.response.PageResponse;
import com.thulirix.dto.response.ProjectResponse;
import com.thulirix.exception.ConflictException;
import com.thulirix.exception.ResourceNotFoundException;
import com.thulirix.exception.ValidationException;
import com.thulirix.repository.ProjectRepository;
import com.thulirix.repository.UserProjectRoleRepository;
import com.thulirix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserProjectRoleRepository userProjectRoleRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> getProjectsForUser(UUID userId, Pageable pageable) {
        Page<Project> page = projectRepository.findAllByMemberRoles_User_IdAndArchivedFalse(userId, pageable);
        return PageResponse.from(page, this::toProjectResponse);
    }

    public ProjectResponse createProject(CreateProjectRequest request, UUID creatorId) {
        if (projectRepository.existsBySlug(request.getSlug())) {
            throw new ConflictException("A project with slug '" + request.getSlug() + "' already exists");
        }

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", creatorId));

        Project project = Project.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .archived(false)
                .build();

        project = projectRepository.save(project);

        UserProjectRole adminRole = UserProjectRole.builder()
                .user(creator)
                .project(project)
                .role(Role.PROJECT_ADMIN)
                .grantedBy(creatorId)
                .grantedAt(Instant.now())
                .build();

        userProjectRoleRepository.save(adminRole);

        log.info("Project '{}' created by user {}", project.getSlug(), creatorId);

        return toProjectResponse(project);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID projectId, UUID userId) {
        validateProjectAccess(projectId, userId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        return toProjectResponse(project);
    }

    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }

        project = projectRepository.save(project);
        log.info("Project {} updated", projectId);
        return toProjectResponse(project);
    }

    public void archiveProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        project.setArchived(true);
        projectRepository.save(project);
        log.info("Project {} archived", projectId);
    }

    public void addMember(UUID projectId, UUID userId, Role role, UUID grantedBy) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (userProjectRoleRepository.existsByProjectIdAndUserIdAndRole(projectId, userId, role)) {
            throw new ConflictException("User already has role " + role + " in this project");
        }

        UserProjectRole memberRole = UserProjectRole.builder()
                .user(user)
                .project(project)
                .role(role)
                .grantedBy(grantedBy)
                .grantedAt(Instant.now())
                .build();

        userProjectRoleRepository.save(memberRole);
        log.info("User {} added to project {} with role {}", userId, projectId, role);
    }

    public void removeMember(UUID projectId, UUID userId, Role role) {
        if (!userProjectRoleRepository.existsByProjectIdAndUserIdAndRole(projectId, userId, role)) {
            throw new ResourceNotFoundException("Member role not found for user " + userId + " in project " + projectId);
        }
        userProjectRoleRepository.deleteByProjectIdAndUserIdAndRole(projectId, userId, role);
        log.info("User {} removed from project {} role {}", userId, projectId, role);
    }

    private void validateProjectAccess(UUID projectId, UUID userId) {
        List<UserProjectRole> roles = userProjectRoleRepository.findByProjectIdAndUserId(projectId, userId);
        if (roles.isEmpty()) {
            throw new ResourceNotFoundException("Project", projectId);
        }
    }

    private ProjectResponse toProjectResponse(Project project) {
        int memberCount = project.getMemberRoles() != null ? project.getMemberRoles().size() : 0;
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .slug(project.getSlug())
                .description(project.getDescription())
                .archived(project.isArchived())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .memberCount(memberCount)
                .build();
    }
}
