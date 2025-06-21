package com.example.HealthCareSystem.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "medical_records")
@Data
@NoArgsConstructor
public class MedicalRecord {

    @Id
    private ObjectId id;

    private String appointmentId;
    private String patientId;
    private String doctorId;
    private String doctorName;

    private String diagnosis;
    private String symptoms;
    private String notes;
    private List<String> allergies = new ArrayList<>();
    private List<String> medicalHistory = new ArrayList<>();

    private String prescription;
    private List<Medication> medications = new ArrayList<>();

    private VitalSigns vitalSigns;

    private List<LabResult> labResults = new ArrayList<>();
    private List<Document> documents = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
    private String status = "ACTIVE";

    @Data
    public static class Medication {
        private String name;
        private String dosage;
        private String frequency;
        private String duration;
        private String instructions;
        private LocalDateTime prescribedDate;
        private String status;
    }

    @Data
    public static class VitalSigns {
        private Double temperature;
        private Integer heartRate;
        private Integer bloodPressureSystolic;
        private Integer bloodPressureDiastolic;
        private Integer respiratoryRate;
        private Double weight;
        private Double height;
        private LocalDateTime recordedAt;
    }

    @Data
    public static class LabResult {
        private String testName;
        private String result;
        private String unit;
        private String referenceRange;
        private LocalDateTime testDate;
        private String status;
        private String notes;
    }

    @Data
    public static class Document {
        private String fileName;
        private String fileType;
        private String fileUrl;
        private String description;
        private LocalDateTime uploadedAt;
        private String uploadedBy;
    }

    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }

    public ObjectId getId() {
        return id;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }
}
