package com.example.HealthCareSystem.service;

import com.example.HealthCareSystem.entity.*;
import com.example.HealthCareSystem.repository.AppointmentRepository;
import com.example.HealthCareSystem.repository.DoctorRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public void saveEntry(Doctors entry){
        doctorRepository.save(entry);
    }

    public List<Doctors> getAll(){
        return doctorRepository.findAll();
    }

    public Optional<Doctors> getDoctorById(ObjectId id){
        return doctorRepository.findById(id);
    }

    public DoctorProfileDTO getDoctorProfile(String doctorId) {
        try {
            System.out.println("Fetching doctor profile for ID: " + doctorId);
            Optional<Doctors> doctorOpt = doctorRepository.findById(new ObjectId(doctorId));
            
            if (!doctorOpt.isPresent()) {
                System.out.println("Doctor not found for ID: " + doctorId);
                return null;
            }

            Doctors doctor = doctorOpt.get();
            System.out.println("Found doctor: " + doctor.toString());
            
            DoctorProfileDTO profile = new DoctorProfileDTO();
            
            // Map basic information
            profile.setId(doctor.getId());
            profile.setUsername(doctor.getUsername());
            profile.setFullName(doctor.getFullName() != null ? doctor.getFullName() : doctor.getUsername());
            profile.setEmail(doctor.getEmail());
            profile.setSpecialty(doctor.getSpecialty());
            profile.setQualification(doctor.getQualification());
            profile.setYearsOfExperience(doctor.getYearsOfExperience());
            profile.setBio(doctor.getBio());
            // profile.setImageUrl(doctor.getImageUrl());
            profile.setLanguages(doctor.getLanguages() != null ? doctor.getLanguages() : new ArrayList<>());
            profile.setWorkingHours(doctor.getWorkingHours() != null ? doctor.getWorkingHours() : new ArrayList<>());
            profile.setAverageRating(doctor.getAverageRating());
            profile.setNumberOfReviews(doctor.getNumberOfReviews());
            profile.setAvailable(doctor.isAvailable());
            profile.setPhoneNumber(doctor.getPhoneNumber());
            profile.setAddress(doctor.getAddress());
            profile.setCertifications(doctor.getCertifications() != null ? doctor.getCertifications() : new ArrayList<>());
            
            // Set default values for null fields
            if (profile.getSpecialty() == null) profile.setSpecialty("General Medicine");
            if (profile.getQualification() == null) profile.setQualification("MBBS");
            if (profile.getBio() == null) profile.setBio("No bio available");
            if (profile.getImageUrl() == null) profile.setImageUrl("/default-avatar.png");
            
            System.out.println("Mapped profile: " + profile.toString());
            return profile;
        } catch (IllegalArgumentException e) {
            System.out.println("Invalid ObjectId format: " + e.getMessage());
            return null;
        } catch (Exception e) {
            System.out.println("Error in getDoctorProfile: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public List<Doctors> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Optional<Doctors> getDoctorById(String id) {
        return doctorRepository.findById(new ObjectId(id));
    }

    public Optional<Doctors> getDoctorByUsername(String username) {
        return doctorRepository.findByUsername(username);
    }

    public Doctors updateDoctorProfile(String doctorId, Doctors updatedDoctor) {
        Optional<Doctors> existingDoctor = doctorRepository.findById(new ObjectId(doctorId));
        if (existingDoctor.isPresent()) {
            Doctors doctor = existingDoctor.get();
            
            // Update fields but preserve sensitive information
            doctor.setFullName(updatedDoctor.getFullName());
            doctor.setSpecialty(updatedDoctor.getSpecialty());
            doctor.setQualification(updatedDoctor.getQualification());
            doctor.setYearsOfExperience(updatedDoctor.getYearsOfExperience());
            doctor.setBio(updatedDoctor.getBio());
            // doctor.setImageUrl(updatedDoctor.getImageUrl());
            doctor.setLanguages(updatedDoctor.getLanguages());
            doctor.setWorkingHours(updatedDoctor.getWorkingHours());
            doctor.setPhoneNumber(updatedDoctor.getPhoneNumber());
            doctor.setAddress(updatedDoctor.getAddress());
            doctor.setCertifications(updatedDoctor.getCertifications());
            doctor.setAvailable(updatedDoctor.isAvailable());

            return doctorRepository.save(doctor);
        }
        return null;
    }

}
