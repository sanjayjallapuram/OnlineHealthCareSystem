package com.example.HealthCareSystem.service;

import com.example.HealthCareSystem.entity.Patients;
import com.example.HealthCareSystem.repository.PatientRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    public void saveEntry(Patients patient){
        patientRepository.save(patient);
    }

    public List<Patients> getAll(){
        return patientRepository.findAll();
    }

    public Optional<Patients> getPatientById(ObjectId id){
        return patientRepository.findById(id);
    }

    public Optional<Patients> findByUsername(String username) {
        return patientRepository.findByUsername(username);
    }
}
