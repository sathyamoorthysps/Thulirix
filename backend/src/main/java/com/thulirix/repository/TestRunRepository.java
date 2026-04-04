package com.thulirix.repository;

import com.thulirix.domain.entity.TestRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestRunRepository extends JpaRepository<TestRun, UUID> {

    Page<TestRun> findByPlanId(UUID planId, Pageable pageable);

    Optional<TestRun> findByPlanIdAndId(UUID planId, UUID id);
}
