package com.thulirix.dto.response;

import com.thulirix.domain.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;
    private String email;
    private String displayName;
    private Set<Role> roles;
    private boolean active;
    private Instant lastLoginAt;
    private Instant createdAt;
}
