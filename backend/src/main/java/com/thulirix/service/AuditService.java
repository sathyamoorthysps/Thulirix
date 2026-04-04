package com.thulirix.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thulirix.domain.entity.AuditLog;
import com.thulirix.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Async("taskExecutor")
    public void log(
            String entityType,
            UUID entityId,
            String action,
            UUID actorId,
            String actorEmail,
            Map<String, Object> changedFields,
            HttpServletRequest request) {

        try {
            String changedFieldsJson = changedFields != null
                    ? objectMapper.writeValueAsString(changedFields)
                    : null;

            String ipAddress = extractClientIp(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .actorId(actorId)
                    .actorEmail(actorEmail)
                    .changedFields(changedFieldsJson)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .occurredAt(Instant.now())
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log for entity {} action {}: {}", entityId, action, e.getMessage(), e);
        }
    }

    public Page<AuditLog> getAuditLog(String entityType, UUID entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByOccurredAtDesc(entityType, entityId, pageable);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
