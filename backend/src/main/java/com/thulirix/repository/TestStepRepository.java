package com.thulirix.repository;

import com.thulirix.domain.entity.TestStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestStepRepository extends JpaRepository<TestStep, UUID> {

    List<TestStep> findByTestCaseIdOrderByStepOrderAsc(UUID testCaseId);

    void deleteByTestCaseId(UUID testCaseId);
}
