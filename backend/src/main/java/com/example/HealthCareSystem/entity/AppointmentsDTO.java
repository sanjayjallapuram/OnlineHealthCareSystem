package com.example.HealthCareSystem.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

//@Document(collection = "appointments")
@Data
@NoArgsConstructor
public class AppointmentsDTO {
    private String patientId;
    private String doctorId;
    private String time;
    private String date;      //optional
    private Integer durationInMinutes;
    private String reason;
    private String status;
}
