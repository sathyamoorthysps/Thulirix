package com.thulirix.controller;

import com.thulirix.dto.request.CreateTagRequest;
import com.thulirix.dto.response.TagResponse;
import com.thulirix.security.UserPrincipal;
import com.thulirix.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/projects/{projectId}/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagResponse>> getTags(@PathVariable UUID projectId) {
        return ResponseEntity.ok(tagService.getTags(projectId));
    }

    @PostMapping
    public ResponseEntity<TagResponse> createTag(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTagRequest request) {
        TagResponse response = tagService.createTag(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{tagId}")
    public ResponseEntity<TagResponse> updateTag(
            @PathVariable UUID projectId,
            @PathVariable UUID tagId,
            @Valid @RequestBody CreateTagRequest request) {
        return ResponseEntity.ok(tagService.updateTag(projectId, tagId, request));
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable UUID projectId,
            @PathVariable UUID tagId) {
        tagService.deleteTag(projectId, tagId);
        return ResponseEntity.noContent().build();
    }

    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
