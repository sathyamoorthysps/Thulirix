package com.thulirix.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tags",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_tag_name_project",
                columnNames = {"project_id", "name"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "color_hex", length = 7)
    private String colorHex;   // e.g. "#FF5733"
}
