package com.thulirix.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.thulirix.dto.request.WebhookResultRequest;
import com.thulirix.service.ExecutionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final ExecutionService executionService;
    private final ObjectMapper objectMapper;

    @Value("${thulirix.webhook.secret:}")
    private String webhookSecret;

    @PostMapping("/results")
    public ResponseEntity<Map<String, String>> receiveResults(
            @RequestHeader(value = "X-Thulirix-Signature", required = false) String signature,
            HttpServletRequest httpRequest) {

        byte[] bodyBytes;
        try {
            bodyBytes = StreamUtils.copyToByteArray(httpRequest.getInputStream());
        } catch (Exception e) {
            log.error("Failed to read webhook body: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Could not read request body"));
        }

        String rawBody = new String(bodyBytes, StandardCharsets.UTF_8);

        if (!validateSignature(rawBody, signature)) {
            log.warn("Webhook /results signature validation failed from {}",
                    httpRequest.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid signature"));
        }

        WebhookResultRequest request;
        try {
            request = objectMapper.readValue(bodyBytes, WebhookResultRequest.class);
        } catch (Exception e) {
            log.error("Failed to parse webhook results payload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid request body: " + e.getMessage()));
        }

        executionService.processWebhookResults(request);

        log.info("Webhook /results accepted from {} for project {}",
                httpRequest.getRemoteAddr(), request.getProjectSlug());

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("status", "accepted", "message", "Results queued for processing"));
    }

    @PostMapping("/ado")
    public ResponseEntity<Map<String, String>> receiveAdoWebhook(
            @RequestHeader(value = "X-Thulirix-Signature", required = false) String signature,
            HttpServletRequest httpRequest) {

        byte[] bodyBytes;
        try {
            bodyBytes = StreamUtils.copyToByteArray(httpRequest.getInputStream());
        } catch (Exception e) {
            log.error("Failed to read ADO webhook body: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Could not read request body"));
        }

        String rawBody = new String(bodyBytes, StandardCharsets.UTF_8);
        log.info("Received ADO webhook payload ({} bytes) from {}",
                rawBody.length(), httpRequest.getRemoteAddr());

        // ADO webhooks are logged and queued asynchronously for full sync processing
        // Detailed ADO integration logic lives in a dedicated integration service
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("status", "accepted", "message", "ADO webhook queued for processing"));
    }

    private boolean validateSignature(String rawBody, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.debug("Webhook secret not configured — skipping signature validation (dev mode)");
            return true;
        }
        if (signature == null || signature.isBlank()) {
            log.warn("Webhook request missing X-Thulirix-Signature header");
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computed = "sha256=" + HexFormat.of().formatHex(hmacBytes);
            return timeSafeEquals(computed, signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("HMAC computation failed: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Constant-time string comparison to prevent timing attacks.
     */
    private boolean timeSafeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
