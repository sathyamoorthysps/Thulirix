package com.thulirix.repository;

import com.thulirix.domain.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findByProjectId(UUID projectId);

    Optional<Tag> findByProjectIdAndNameIgnoreCase(UUID projectId, String name);

    List<Tag> findByIdInAndProjectId(Set<UUID> ids, UUID projectId);
}
