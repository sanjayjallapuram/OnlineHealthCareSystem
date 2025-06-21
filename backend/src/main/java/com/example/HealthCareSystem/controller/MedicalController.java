package com.example.HealthCareSystem.controller;

import com.example.HealthCareSystem.entity.MedicalRecord;
import com.example.HealthCareSystem.service.MedicalRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/medical-records")
public class MedicalController {
    private static final Logger logger = LoggerFactory.getLogger(MedicalController.class);

    @Autowired
    private MedicalRecordService medicalRecordService;

    @GetMapping
    public ResponseEntity<List<MedicalRecord>> getAllRecords() {
        return ResponseEntity.ok(medicalRecordService.getAll());
    }

    @PostMapping
    public ResponseEntity<MedicalRecord> createRecord(@RequestBody MedicalRecord record) {
        return ResponseEntity.ok(medicalRecordService.createMedicalRecord(record));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecord>> getByPatientId(@PathVariable String patientId) {
        return ResponseEntity.ok(medicalRecordService.getByPatientId(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<MedicalRecord>> getByDoctorId(@PathVariable String doctorId) {
        return ResponseEntity.ok(medicalRecordService.getByDoctorId(doctorId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getByAppointment(@PathVariable String appointmentId) {
        try {
            List<MedicalRecord> byAppointmentId = medicalRecordService.getByAppointmentId(appointmentId);
            return new ResponseEntity<>(byAppointmentId, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error fetching medical records for appointment: {}", appointmentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching appointment medical records: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            logger.info("Fetching medical record with ID: {}", id);
            
            if (id == null || id.trim().isEmpty()) {
                logger.error("Invalid ID provided: {}", id);
                return ResponseEntity.badRequest().body("Invalid ID provided");
            }

            Optional<MedicalRecord> record = medicalRecordService.getById(id);
            
            if (record.isPresent()) {
                logger.info("Successfully found medical record with ID: {}", id);
                return ResponseEntity.ok(record.get());
            }
            
            logger.warn("Medical record not found with ID: {}", id);
            return ResponseEntity.notFound().build();
            
        } catch (IllegalArgumentException e) {
            logger.error("Invalid medical record ID format: {}", id);
            return ResponseEntity.badRequest().body("Invalid medical record ID format");
        } catch (Exception e) {
            logger.error("Error fetching medical record with ID: {}. Error: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching medical record: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody MedicalRecord record) {
        try {
            MedicalRecord medicalRecord = medicalRecordService.updateMedicalRecord(id, record);
            return new ResponseEntity<>(medicalRecord, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error updating medical record: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating medical record: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            medicalRecordService.deleteById(id);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error deleting medical record: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting medical record: " + e.getMessage());
        }
    }
}
