package com.thulirix.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TestPlanResponse {

    private UUID id;
    private String name;
    private String description;
    private String status;
    private String environment;
    private String buildVersion;
    private LocalDate startDate;
    private LocalDate endDate;
    private String adoPlanId;
    private int totalCases;
    private List<UUID> testCaseIds;
}
