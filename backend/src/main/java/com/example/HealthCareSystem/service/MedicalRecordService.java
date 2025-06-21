package com.example.HealthCareSystem.service;

import com.example.HealthCareSystem.entity.MedicalRecord;
import com.example.HealthCareSystem.repository.MedicalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MedicalRecordService {

    private static final Logger logger = LoggerFactory.getLogger(MedicalRecordService.class);

    @Autowired
    private MedicalRecordRepository medicalRecordRepository;

    public MedicalRecord createMedicalRecord(MedicalRecord record) {
        record.setCreatedAt(LocalDateTime.now());
        return medicalRecordRepository.save(record);
    }

    public List<MedicalRecord> getAll() {
        return medicalRecordRepository.findAll();
    }

    public List<MedicalRecord> getByPatientId(String patientId) {
        return medicalRecordRepository.findByPatientId(patientId);
    }

    public List<MedicalRecord> getByDoctorId(String doctorId) {
        return medicalRecordRepository.findByDoctorId(doctorId);
    }

    public List<MedicalRecord> getByAppointmentId(String appointmentId) {
        return medicalRecordRepository.findByAppointmentId(appointmentId);
    }

    public Optional<MedicalRecord> getById(String id) {
        try {
            if (id == null || id.trim().isEmpty()) {
                logger.error("Invalid ID provided to getById: {}", id);
                return Optional.empty();
            }

            ObjectId objectId;
            try {
                objectId = new ObjectId(id);
            } catch (IllegalArgumentException e) {
                logger.error("Invalid ObjectId format: {}. Error: {}", id, e.getMessage());
                throw new IllegalArgumentException("Invalid medical record ID format");
            }

            Optional<MedicalRecord> record = medicalRecordRepository.findById(objectId);
            if (!record.isPresent()) {
                logger.warn("No medical record found for ID: {}", id);
            } else {
                logger.info("Successfully retrieved medical record for ID: {}", id);
            }
            return record;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving medical record with ID: {}. Error: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve medical record: " + e.getMessage(), e);
        }
    }

    public void deleteById(String id){
        medicalRecordRepository.deleteById(new ObjectId(id));
    }

    public MedicalRecord updateMedicalRecord(String id, MedicalRecord updatedRecord) {
        return medicalRecordRepository.findById(new ObjectId(id)).map(existing -> {
            // Update basic fields
            existing.setDiagnosis(updatedRecord.getDiagnosis());
            existing.setSymptoms(updatedRecord.getSymptoms());
            existing.setNotes(updatedRecord.getNotes());
            existing.setPrescription(updatedRecord.getPrescription());
            
            // Update medications
            if (updatedRecord.getMedications() != null) {
                existing.setMedications(updatedRecord.getMedications());
            }
            
            // Update vital signs
            if (updatedRecord.getVitalSigns() != null) {
                existing.setVitalSigns(updatedRecord.getVitalSigns());
            }
            
            // Update lab results
            if (updatedRecord.getLabResults() != null) {
                existing.setLabResults(updatedRecord.getLabResults());
            }
            
            // Update allergies and medical history
            if (updatedRecord.getAllergies() != null) {
                existing.setAllergies(updatedRecord.getAllergies());
            }
            if (updatedRecord.getMedicalHistory() != null) {
                existing.setMedicalHistory(updatedRecord.getMedicalHistory());
            }
            
            // Update documents
            if (updatedRecord.getDocuments() != null) {
                existing.setDocuments(updatedRecord.getDocuments());
            }
            
            // Update timestamps
            existing.setUpdatedAt(LocalDateTime.now());
            
            return medicalRecordRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Medical record not found"));
    }
}
