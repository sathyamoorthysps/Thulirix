package com.thulirix.service;

import com.thulirix.domain.entity.Project;
import com.thulirix.domain.entity.Tag;
import com.thulirix.dto.request.CreateTagRequest;
import com.thulirix.dto.response.TagResponse;
import com.thulirix.exception.ConflictException;
import com.thulirix.exception.ResourceNotFoundException;
import com.thulirix.repository.ProjectRepository;
import com.thulirix.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<TagResponse> getTags(UUID projectId) {
        return tagRepository.findByProjectId(projectId)
                .stream()
                .map(this::toTagResponse)
                .collect(Collectors.toList());
    }

    public TagResponse createTag(UUID projectId, CreateTagRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        tagRepository.findByProjectIdAndNameIgnoreCase(projectId, request.getName())
                .ifPresent(t -> {
                    throw new ConflictException("A tag with name '" + request.getName() + "' already exists in this project");
                });

        Tag tag = Tag.builder()
                .project(project)
                .name(request.getName())
                .colorHex(request.getColorHex())
                .build();

        tag = tagRepository.save(tag);
        log.info("Tag '{}' created in project {}", tag.getName(), projectId);
        return toTagResponse(tag);
    }

    public TagResponse updateTag(UUID projectId, UUID tagId, CreateTagRequest request) {
        Tag tag = tagRepository.findById(tagId)
                .filter(t -> t.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));

        tagRepository.findByProjectIdAndNameIgnoreCase(projectId, request.getName())
                .filter(t -> !t.getId().equals(tagId))
                .ifPresent(t -> {
                    throw new ConflictException("A tag with name '" + request.getName() + "' already exists in this project");
                });

        tag.setName(request.getName());
        if (request.getColorHex() != null) {
            tag.setColorHex(request.getColorHex());
        }

        tag = tagRepository.save(tag);
        log.info("Tag {} updated in project {}", tagId, projectId);
        return toTagResponse(tag);
    }

    public void deleteTag(UUID projectId, UUID tagId) {
        Tag tag = tagRepository.findById(tagId)
                .filter(t -> t.getProject().getId().equals(projectId))
                .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));

        tagRepository.delete(tag);
        log.info("Tag {} deleted from project {}", tagId, projectId);
    }

    private TagResponse toTagResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .colorHex(tag.getColorHex())
                .projectId(tag.getProject().getId())
                .build();
    }
}
