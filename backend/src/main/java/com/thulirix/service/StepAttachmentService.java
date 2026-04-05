package com.thulirix.service;

import com.thulirix.domain.entity.StepAttachment;
import com.thulirix.domain.entity.TestStep;
import com.thulirix.dto.response.StepAttachmentResponse;
import com.thulirix.exception.ResourceNotFoundException;
import com.thulirix.repository.StepAttachmentRepository;
import com.thulirix.repository.TestStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StepAttachmentService {

    private final StepAttachmentRepository attachmentRepository;
    private final TestStepRepository testStepRepository;

    @Value("${thulirix.upload.dir:${user.home}/thulirix/uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
    private static final List<String> ALLOWED_TYPES = List.of(
            "image/png", "image/jpeg", "image/gif", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain", "text/csv"
    );

    @Transactional
    public StepAttachmentResponse upload(UUID testStepId, MultipartFile file, UUID uploadedBy) throws IOException {
        TestStep step = testStepRepository.findById(testStepId)
                .orElseThrow(() -> new ResourceNotFoundException("TestStep", testStepId));

        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > MAX_FILE_SIZE) throw new IllegalArgumentException("File exceeds 20 MB limit");

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("File type not allowed: " + mimeType);
        }

        Path storageDir = Paths.get(uploadDir).resolve(testStepId.toString());
        Files.createDirectories(storageDir);

        String storedName = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path dest = storageDir.resolve(storedName);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        StepAttachment attachment = StepAttachment.builder()
                .testStep(step)
                .originalName(file.getOriginalFilename())
                .storedName(storedName)
                .mimeType(mimeType)
                .fileSize(file.getSize())
                .uploadedBy(uploadedBy)
                .build();

        attachment = attachmentRepository.save(attachment);
        log.info("Uploaded attachment {} for step {}", storedName, testStepId);
        return toResponse(attachment);
    }

    @Transactional(readOnly = true)
    public List<StepAttachmentResponse> listByStep(UUID testStepId) {
        return attachmentRepository.findByTestStepIdOrderByCreatedAtAsc(testStepId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Resource download(UUID attachmentId) throws MalformedURLException {
        StepAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));
        Path file = Paths.get(uploadDir)
                .resolve(att.getTestStep().getId().toString())
                .resolve(att.getStoredName());
        Resource resource = new UrlResource(file.toUri());
        if (!resource.exists()) throw new ResourceNotFoundException("Attachment file", attachmentId);
        return resource;
    }

    @Transactional
    public void delete(UUID attachmentId) throws IOException {
        StepAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));
        Path file = Paths.get(uploadDir)
                .resolve(att.getTestStep().getId().toString())
                .resolve(att.getStoredName());
        Files.deleteIfExists(file);
        attachmentRepository.delete(att);
        log.info("Deleted attachment {}", attachmentId);
    }

    private StepAttachmentResponse toResponse(StepAttachment att) {
        return StepAttachmentResponse.builder()
                .id(att.getId())
                .testStepId(att.getTestStep().getId())
                .originalName(att.getOriginalName())
                .mimeType(att.getMimeType())
                .fileSize(att.getFileSize())
                .createdAt(att.getCreatedAt())
                .downloadUrl("/api/v1/attachments/" + att.getId() + "/file")
                .build();
    }

    private String sanitize(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
