package com.example.HealthCareSystem.controller;

import com.example.HealthCareSystem.entity.DoctorProfileDTO;
import com.example.HealthCareSystem.entity.Doctors;
// import com.example.HealthCareSystem.entity.Review;
import com.example.HealthCareSystem.service.DoctorService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/doctor")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @GetMapping
    public ResponseEntity<List<Doctors>> getDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('doctor')")
    public ResponseEntity<String> dashboard(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok("Welcome Doctor! you have access");
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getDoctorProfile(@PathVariable String id) {
        try {
            DoctorProfileDTO profile = doctorService.getDoctorProfile(id);
            if (profile != null) {
                return ResponseEntity.ok(profile);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Doctor profile not found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching doctor profile: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDoctorById(@PathVariable String id){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        ObjectId objectId = new ObjectId(id);
        Optional<?> doctorById = doctorService.getDoctorById(objectId);
        if(doctorById.isPresent()){
            return new ResponseEntity<>(doctorById,HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    public ResponseEntity<?> saveEntry(@RequestBody Doctors doctors){
        try{
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            doctorService.saveEntry(doctors);
            return new ResponseEntity<>(doctors,HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(doctors,HttpStatus.NOT_IMPLEMENTED);
        }
    }
    
    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable String id, @RequestBody Doctors updatedDoctor) {
        Doctors doctor = doctorService.updateDoctorProfile(id, updatedDoctor);
        if (doctor != null) {
            return ResponseEntity.ok(doctor);
        }
        return ResponseEntity.notFound().build();
    }
}
