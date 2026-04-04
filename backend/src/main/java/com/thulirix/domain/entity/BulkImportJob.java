package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bulk_import_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkImportJob extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 10)
    private String fileType;   // JSON | EXCEL

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "QUEUED";
    // QUEUED | VALIDATING | IMPORTING | COMPLETED | COMPLETED_WITH_ERRORS | FAILED

    @Column(name = "total_records")
    private Integer totalRecords;

    @Column(name = "imported_count", nullable = false)
    @Builder.Default
    private Integer importedCount = 0;

    @Column(name = "skipped_count", nullable = false)
    @Builder.Default
    private Integer skippedCount = 0;

    @Column(name = "error_count", nullable = false)
    @Builder.Default
    private Integer errorCount = 0;

    // [{row: 3, field: "priority", error: "invalid value"}]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "error_detail", columnDefinition = "jsonb")
    private String errorDetail;

    @Column(name = "idempotency_key", length = 200)
    private String idempotencyKey;

    @Column(name = "completed_at")
    private Instant completedAt;
}
