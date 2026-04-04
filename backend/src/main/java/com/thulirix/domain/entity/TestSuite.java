package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "test_suites", indexes = {
        @Index(name = "idx_suite_project", columnList = "project_id"),
        @Index(name = "idx_suite_parent", columnList = "parent_suite_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestSuite extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_suite_id")
    private TestSuite parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestSuite> children = new ArrayList<>();

    @Column(nullable = false, length = 300)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "suite_order", nullable = false)
    @Builder.Default
    private Integer suiteOrder = 0;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "test_suite_cases",
            joinColumns = @JoinColumn(name = "suite_id"),
            inverseJoinColumns = @JoinColumn(name = "test_case_id"))
    @Builder.Default
    private Set<TestCase> testCases = new HashSet<>();
}
