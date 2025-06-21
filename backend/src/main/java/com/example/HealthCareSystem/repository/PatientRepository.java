package com.example.HealthCareSystem.repository;

import com.example.HealthCareSystem.entity.Patients;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PatientRepository extends MongoRepository<Patients, ObjectId> {
    Optional<Patients> findByUsername(String username);
}
