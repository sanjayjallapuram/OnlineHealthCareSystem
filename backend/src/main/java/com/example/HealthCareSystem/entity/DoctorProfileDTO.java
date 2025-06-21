package com.example.HealthCareSystem.entity;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class DoctorProfileDTO {
    private String id;
    private String username;
    private String fullName;
    private String email;
    private String specialty;
    private String qualification;
    private int yearsOfExperience;
    private String bio;
    private String imageUrl;
    private List<String> languages;
    private List<WorkingHours> workingHours;
    private double averageRating;
    private int numberOfReviews;
    // private List<Review> recentReviews;
    private boolean isAvailable;
    private String phoneNumber;
    private String address;
    private List<String> certifications;
    // private List<TimeSlot> availableSlots;
} 