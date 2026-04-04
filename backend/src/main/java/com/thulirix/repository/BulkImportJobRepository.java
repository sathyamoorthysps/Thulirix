package com.thulirix.repository;

import com.thulirix.domain.entity.BulkImportJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BulkImportJobRepository extends JpaRepository<BulkImportJob, UUID> {

    Page<BulkImportJob> findByProjectId(UUID projectId, Pageable pageable);

    Optional<BulkImportJob> findByProjectIdAndIdempotencyKey(UUID projectId, String idempotencyKey);
}
