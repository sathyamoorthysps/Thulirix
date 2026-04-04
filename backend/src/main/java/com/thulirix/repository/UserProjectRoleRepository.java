package com.thulirix.repository;

import com.thulirix.domain.entity.UserProjectRole;
import com.thulirix.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserProjectRoleRepository extends JpaRepository<UserProjectRole, UUID> {

    List<UserProjectRole> findByProjectIdAndUserId(UUID projectId, UUID userId);

    List<UserProjectRole> findByProjectId(UUID projectId);

    boolean existsByProjectIdAndUserIdAndRole(UUID projectId, UUID userId, Role role);

    void deleteByProjectIdAndUserIdAndRole(UUID projectId, UUID userId, Role role);
}
