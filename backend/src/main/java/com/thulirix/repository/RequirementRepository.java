package com.thulirix.repository;

import com.thulirix.domain.entity.Requirement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RequirementRepository extends JpaRepository<Requirement, UUID> {

    Page<Requirement> findByProjectIdAndActiveTrue(UUID projectId, Pageable pageable);

    Optional<Requirement> findByProjectIdAndReqKey(UUID projectId, String reqKey);
}
