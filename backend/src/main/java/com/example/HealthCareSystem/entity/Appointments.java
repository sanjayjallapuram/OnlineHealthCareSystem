package com.example.HealthCareSystem.entity;

import com.example.HealthCareSystem.enums.AppointmentStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Date;

@Document(collection = "appointments")
@Data
@NoArgsConstructor
public class Appointments {
    @Id
    private String id;
    private String patientId;
    private String doctorId;
    private String patientName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer durationInMinutes;
    private String reason;
    private AppointmentStatus status= AppointmentStatus.PENDING;
}
