package com.thulirix.repository;

import com.thulirix.domain.entity.TestPlanCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestPlanCaseRepository extends JpaRepository<TestPlanCase, UUID> {

    List<TestPlanCase> findByTestPlanId(UUID planId);

    void deleteByTestPlanId(UUID planId);
}
