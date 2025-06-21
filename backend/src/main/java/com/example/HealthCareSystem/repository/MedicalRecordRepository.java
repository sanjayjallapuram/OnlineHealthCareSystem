package com.example.HealthCareSystem.repository;

import com.example.HealthCareSystem.entity.MedicalRecord;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, ObjectId> {
    List<MedicalRecord> findByPatientId(String patientId);
    List<MedicalRecord> findByDoctorId(String doctorId);
    List<MedicalRecord> findByAppointmentId(String appointmentId);
}
