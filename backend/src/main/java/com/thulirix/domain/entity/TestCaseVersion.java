package com.thulirix.domain.entity;

import com.thulirix.domain.enums.Priority;
import com.thulirix.domain.enums.TestCaseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "test_case_versions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_tc_version",
                columnNames = {"test_case_id", "version_number"}),
        indexes = @Index(name = "idx_tcv_test_case", columnList = "test_case_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCaseVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Column(columnDefinition = "TEXT")
    private String preconditions;

    @Column(columnDefinition = "TEXT")
    private String postconditions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TestCaseStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority;

    // Full snapshot of steps at this version
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "steps_snapshot", columnDefinition = "jsonb", nullable = false)
    private String stepsSnapshot;

    @Column(name = "change_summary", columnDefinition = "TEXT")
    private String changeSummary;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
