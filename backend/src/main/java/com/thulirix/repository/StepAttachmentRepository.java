package com.thulirix.repository;

import com.thulirix.domain.entity.StepAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StepAttachmentRepository extends JpaRepository<StepAttachment, UUID> {
    List<StepAttachment> findByTestStepIdOrderByCreatedAtAsc(UUID testStepId);
    void deleteByTestStepId(UUID testStepId);
}
