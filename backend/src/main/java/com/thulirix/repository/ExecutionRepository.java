package com.thulirix.repository;

import com.thulirix.domain.entity.Execution;
import com.thulirix.domain.enums.ExecutionResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, UUID> {

    List<Execution> findByRunId(UUID runId);

    Optional<Execution> findByRunIdAndTestCaseId(UUID runId, UUID testCaseId);

    long countByRunIdAndResult(UUID runId, ExecutionResult result);

    Page<Execution> findByTestCaseIdOrderByCreatedAtDesc(UUID testCaseId, Pageable pageable);

    @Query("""
            SELECT COUNT(e) FROM Execution e
            WHERE e.run.plan.project.id = :projectId
              AND e.createdAt >= :since
              AND e.result = :result
            """)
    long countByProjectIdAndResultSince(
            @Param("projectId") UUID projectId,
            @Param("result") ExecutionResult result,
            @Param("since") Instant since);

    @Query("""
            SELECT COUNT(e) FROM Execution e
            WHERE e.run.plan.project.id = :projectId
              AND e.createdAt >= :since
            """)
    long countByProjectIdSince(@Param("projectId") UUID projectId, @Param("since") Instant since);

    @Query(value = """
            SELECT CAST(date_trunc('day', e.created_at) AS date) AS day,
                   SUM(CASE WHEN e.result = 'PASS' THEN 1 ELSE 0 END) AS passed,
                   SUM(CASE WHEN e.result = 'FAIL' THEN 1 ELSE 0 END) AS failed,
                   COUNT(*) AS total
            FROM executions e
            JOIN test_runs r ON e.run_id = r.id
            JOIN test_plans p ON r.plan_id = p.id
            WHERE p.project_id = :projectId
              AND e.created_at >= :since
            GROUP BY day
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> getDailyTrendSince(@Param("projectId") UUID projectId, @Param("since") Instant since);

    @Query("""
            SELECT COUNT(e) FROM Execution e
            WHERE e.run.plan.project.id = :projectId
              AND e.createdAt >= :since
              AND e.automated = true
            """)
    long countAutomatedByProjectIdSince(@Param("projectId") UUID projectId, @Param("since") Instant since);
}
