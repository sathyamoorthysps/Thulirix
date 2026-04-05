package com.thulirix.controller;

import com.thulirix.dto.response.StepAttachmentResponse;
import com.thulirix.security.UserPrincipal;
import com.thulirix.service.StepAttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
public class StepAttachmentController {

    private final StepAttachmentService attachmentService;

    /** Upload a file to a specific test step */
    @PostMapping("/api/v1/steps/{stepId}/attachments")
    public ResponseEntity<StepAttachmentResponse> upload(
            @PathVariable UUID stepId,
            @RequestParam("file") MultipartFile file) throws IOException {
        UserPrincipal principal = getCurrentUser();
        return ResponseEntity.ok(attachmentService.upload(stepId, file, principal.getId()));
    }

    /** List all attachments for a test step */
    @GetMapping("/api/v1/steps/{stepId}/attachments")
    public ResponseEntity<List<StepAttachmentResponse>> list(@PathVariable UUID stepId) {
        return ResponseEntity.ok(attachmentService.listByStep(stepId));
    }

    /** Download / serve a file by attachment ID */
    @GetMapping("/api/v1/attachments/{attachmentId}/file")
    public ResponseEntity<Resource> download(@PathVariable UUID attachmentId) throws IOException {
        Resource resource = attachmentService.download(attachmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    /** Delete an attachment */
    @DeleteMapping("/api/v1/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID attachmentId) throws IOException {
        attachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }

    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
