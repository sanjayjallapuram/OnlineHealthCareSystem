package com.example.HealthCareSystem.repository;

import com.example.HealthCareSystem.entity.Doctors;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface DoctorRepository extends MongoRepository<Doctors, ObjectId> {
    Optional<Doctors> findByUsername(String username);
}
