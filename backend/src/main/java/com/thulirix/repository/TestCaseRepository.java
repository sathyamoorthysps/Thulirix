package com.thulirix.repository;

import com.thulirix.domain.entity.TestCase;
import com.thulirix.domain.enums.AutomationStatus;
import com.thulirix.domain.enums.TestCaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {

    Page<TestCase> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query("""
            SELECT tc FROM TestCase tc
            WHERE tc.project.id = :projectId
              AND tc.deleted = false
              AND (:title IS NULL OR LOWER(tc.title) LIKE LOWER(CONCAT('%', :title, '%')))
              AND (:status IS NULL OR CAST(tc.status AS string) = :status)
              AND (:priority IS NULL OR CAST(tc.priority AS string) = :priority)
              AND (:automationStatus IS NULL OR CAST(tc.automationStatus AS string) = :automationStatus)
            """)
    Page<TestCase> searchTestCases(
            @Param("projectId") UUID projectId,
            @Param("title") String title,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("automationStatus") String automationStatus,
            Pageable pageable);

    Optional<TestCase> findByProjectIdAndTcKeyAndDeletedFalse(UUID projectId, String tcKey);

    @Query("""
            SELECT MAX(CAST(SUBSTRING(tc.tcKey, 4) AS int))
            FROM TestCase tc
            WHERE tc.project.id = :projectId
            """)
    Optional<Integer> findMaxTcKey(@Param("projectId") UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndStatusAndDeletedFalse(UUID projectId, TestCaseStatus status);

    long countByProjectIdAndAutomationStatusNotAndDeletedFalse(UUID projectId, AutomationStatus automationStatus);

    @Query("SELECT tc.status, COUNT(tc) FROM TestCase tc WHERE tc.project.id = :projectId AND tc.deleted = false GROUP BY tc.status")
    List<Object[]> countByStatusForProject(@Param("projectId") UUID projectId);
}
