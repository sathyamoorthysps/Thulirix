package com.thulirix.repository;

import com.thulirix.domain.entity.TestCaseVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestCaseVersionRepository extends JpaRepository<TestCaseVersion, UUID> {

    List<TestCaseVersion> findByTestCaseIdOrderByVersionNumberDesc(UUID testCaseId);

    Optional<TestCaseVersion> findByTestCaseIdAndVersionNumber(UUID testCaseId, int versionNumber);

    Optional<TestCaseVersion> findTopByTestCaseIdOrderByVersionNumberDesc(UUID testCaseId);
}
