package com.thulirix.domain.entity;

import com.thulirix.domain.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_project_roles",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_project_role",
                columnNames = {"user_id", "project_id", "role"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProjectRole extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Role role;

    @Column(name = "granted_by")
    private UUID grantedBy;

    @Column(name = "granted_at")
    @Builder.Default
    private Instant grantedAt = Instant.now();
}
