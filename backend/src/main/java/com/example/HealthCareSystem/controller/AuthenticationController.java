package com.example.HealthCareSystem.controller;

import com.example.HealthCareSystem.Util.JwtUtil;
import com.example.HealthCareSystem.dto.AuthResponse;
import com.example.HealthCareSystem.entity.Doctors;
import com.example.HealthCareSystem.entity.Patients;
import com.example.HealthCareSystem.entity.User;
import com.example.HealthCareSystem.service.DoctorService;
import com.example.HealthCareSystem.service.PatientService;
import com.example.HealthCareSystem.service.UserDetailsServiceImpl;
import com.example.HealthCareSystem.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.HashSet;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final DoctorService doctorService;
    private final PatientService patientService;

    @PostMapping("/patient-register")
    public ResponseEntity<AuthResponse> register(@RequestBody Patients patient) {
        try {
            log.info("Attempting to register patient: {}", patient.getUsername());
            
            // Check if username already exists
            if (userService.existsByUsername(patient.getUsername())) {
                log.warn("Username already exists: {}", patient.getUsername());
                return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Patient already exists")
                        .build());
            }

            // Create User entity with encrypted password
            User user = new User();
            user.setUsername(patient.getUsername());
            user.setEmail(patient.getEmail());
            user.setPassword(patient.getPassword()); // Will be encrypted by UserService
            user.setRoles(Set.of("ROLE_PATIENT"));
            
            // Save user first to get encrypted password
            boolean userSaved = userService.saveNewUser(user);
            if (!userSaved) {
                log.error("Failed to save user: {}", patient.getUsername());
                return ResponseEntity.internalServerError()
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Failed to save user")
                        .build());
            }

            // Get the saved user to get encrypted password
            User savedUser = userService.findByUsername(patient.getUsername());
            
            // Set encrypted password for patient
            patient.setPassword(savedUser.getPassword());

            // Save patient
            try {
                patientService.saveEntry(patient);
                log.info("Patient saved successfully: {}", patient.getUsername());
            } catch (Exception e) {
                log.error("Failed to save patient: {}", patient.getUsername());
                // Delete the user since patient save failed
                userService.deleteUser(patient.getUsername());
                return ResponseEntity.internalServerError()
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Failed to save patient")
                        .build());
            }

            // Generate token
            Set<String> roles = new HashSet<>();
            roles.add("ROLE_PATIENT");
            String token = jwtUtil.generateToken(patient.getUsername(), roles);
            log.info("Registration successful for patient: {}", patient.getUsername());

            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Patient registered successfully")
                .token(token)
                .username(patient.getUsername())
                .email(patient.getEmail())
                .roles(roles)
                .build());

        } catch (Exception e) {
            log.error("Registration failed for patient: {}", patient.getUsername(), e);
            return ResponseEntity.internalServerError()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Registration failed: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/patient-login")
    public ResponseEntity<AuthResponse> patientlogin(@RequestBody Patients patient) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(patient.getUsername(), patient.getPassword())
            );

            UserDetails userDetails = userDetailsService.loadUserByUsername(patient.getUsername());
            User fullUser = userService.findByUsername(patient.getUsername());
            
            // Check if user has ROLE_PATIENT
            if (!fullUser.getRoles().contains("ROLE_PATIENT")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("This login is for patients only. Please use the doctor login page.")
                        .build());
            }

            String token = jwtUtil.generateToken(userDetails.getUsername(), fullUser.getRoles());

            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .username(fullUser.getUsername())
                .email(fullUser.getEmail())
                .roles(fullUser.getRoles())
                .build());

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Invalid username or password")
                    .build());
        } catch (Exception e) {
            log.error("Login failed for patient: " + patient.getUsername(), e);
            return ResponseEntity.internalServerError()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Login failed: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/doctor-register")
    public ResponseEntity<AuthResponse> doctorRegister(@RequestBody Doctors doctor) {
        try {
            log.info("Attempting to register doctor: {}", doctor.getUsername());
            
            // Check if username already exists
            if (userService.existsByUsername(doctor.getUsername())) {
                log.warn("Username already exists: {}", doctor.getUsername());
                return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Username already exists")
                        .build());
            }

            // Create User entity with encrypted password
            User user = new User();
            user.setUsername(doctor.getUsername());
            user.setEmail(doctor.getEmail());
            user.setPassword(doctor.getPassword()); // Will be encrypted by UserService
            user.setRoles(Set.of("ROLE_DOCTOR"));
            
            // Save user first to get encrypted password
            boolean userSaved = userService.saveNewUser(user);
            if (!userSaved) {
                log.error("Failed to save user: {}", doctor.getUsername());
                return ResponseEntity.internalServerError()
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Failed to save user")
                        .build());
            }

            // Get the saved user to get encrypted password
            User savedUser = userService.findByUsername(doctor.getUsername());
            
            // Set encrypted password for doctor
            doctor.setPassword(savedUser.getPassword());

            // Save doctor
            try {
                doctorService.saveEntry(doctor);
                log.info("Doctor saved successfully: {}", doctor.getUsername());
            } catch (Exception e) {
                log.error("Failed to save doctor: {}", doctor.getUsername());
                // Delete the user since doctor save failed
                userService.deleteUser(doctor.getUsername());
                return ResponseEntity.internalServerError()
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Failed to save doctor")
                        .build());
            }

            // Generate token
            Set<String> roles = new HashSet<>();
            roles.add("ROLE_DOCTOR");
            String token = jwtUtil.generateToken(doctor.getUsername(), roles);
            log.info("Registration successful for doctor: {}", doctor.getUsername());

            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Doctor registered successfully")
                .token(token)
                .username(doctor.getUsername())
                .email(doctor.getEmail())
                .roles(roles)
                .build());

        } catch (Exception e) {
            log.error("Registration failed for doctor: {}", doctor.getUsername(), e);
            return ResponseEntity.internalServerError()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Registration failed: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/doctor-login")
    public ResponseEntity<AuthResponse> doctorlogin(@RequestBody Doctors user) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword())
            );

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            User fullUser = userService.findByUsername(user.getUsername());
            
            // Check if user has ROLE_DOCTOR
            if (!fullUser.getRoles().contains("ROLE_DOCTOR")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("This login is for doctors only. Please use the patient login page.")
                        .build());
            }

            String token = jwtUtil.generateToken(userDetails.getUsername(), fullUser.getRoles());

            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .token(token)
                .username(fullUser.getUsername())
                .email(fullUser.getEmail())
                .roles(fullUser.getRoles())
                .build());

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Invalid username or password")
                    .build());
        } catch (Exception e) {
            log.error("Login failed for doctor: " + user.getUsername(), e);
            return ResponseEntity.internalServerError()
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Login failed: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<AuthResponse> validateToken(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Invalid token")
                        .build());
            }

            String username = jwtUtil.extractUsername(token);
            User user = userService.findByUsername(username);

            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Token is valid")
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles())
                .id(user.getId())
                .build());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Token validation failed")
                    .build());
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<AuthResponse> validateTokenGet(@RequestHeader("Authorization") String token) {
        try {
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            if (!jwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                        .success(false)
                        .message("Invalid token")
                        .build());
            }

            String username = jwtUtil.extractUsername(token);
            User user = userService.findByUsername(username);

            return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Token is valid")
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles())
                .build());
        } catch (Exception e) {
            log.error("Token validation failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(AuthResponse.builder()
                    .success(false)
                    .message("Token validation failed")
                    .build());
        }
    }

   
}