package com.example.HealthCareSystem.entity;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class WorkingHours {
    private String dayOfWeek; // e.g., "MONDAY"
    private String startTime; // e.g., "09:00"
    private String endTime;   // e.g., "17:00"
} 