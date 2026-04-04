package com.thulirix.repository;

import com.thulirix.domain.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Project> findByArchivedFalse(Pageable pageable);

    Page<Project> findAllByMemberRoles_User_IdAndArchivedFalse(UUID userId, Pageable pageable);
}
