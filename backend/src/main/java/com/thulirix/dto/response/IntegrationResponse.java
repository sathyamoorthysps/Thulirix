package com.thulirix.dto.response;

import com.thulirix.domain.enums.IntegrationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class IntegrationResponse {

    private UUID id;
    private IntegrationType integrationType;
    private String name;
    private boolean enabled;
    private Instant lastSyncAt;
    private String syncStatus;
}
