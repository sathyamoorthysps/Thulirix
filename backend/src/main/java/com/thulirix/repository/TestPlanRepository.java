package com.thulirix.repository;

import com.thulirix.domain.entity.TestPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestPlanRepository extends JpaRepository<TestPlan, UUID> {

    Page<TestPlan> findByProjectId(UUID projectId, Pageable pageable);

    Optional<TestPlan> findByProjectIdAndId(UUID projectId, UUID id);
}
