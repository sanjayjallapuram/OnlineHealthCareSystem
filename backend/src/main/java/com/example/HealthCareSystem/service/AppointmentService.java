package com.example.HealthCareSystem.service;

import com.example.HealthCareSystem.entity.Appointments;
import com.example.HealthCareSystem.entity.AppointmentsDTO;
import com.example.HealthCareSystem.entity.Patients;
import com.example.HealthCareSystem.entity.Doctors;
import com.example.HealthCareSystem.enums.AppointmentStatus;
import com.example.HealthCareSystem.repository.AppointmentRepository;
import com.example.HealthCareSystem.repository.PatientRepository;
import com.example.HealthCareSystem.repository.DoctorRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private static final int MIN_APPOINTMENT_DURATION = 15;
    private static final int MAX_APPOINTMENT_DURATION = 120;
    private static final int DEFAULT_APPOINTMENT_DURATION = 30;
    private static final int BUFFER_TIME = 5;
    private static final LocalTime WORKING_HOURS_START = LocalTime.of(9, 0);
    private static final LocalTime WORKING_HOURS_END = LocalTime.of(17, 0);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private EmailService emailService;

    public Appointments saveAppointment(Appointments appointments){
        return appointmentRepository.save(appointments);
    }

    public List<Appointments> getAllAppointments(){
        return appointmentRepository.findAll();
    }

    public List<Appointments> getAppointmentsForPatient(String patientId){
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointments> getAppointmentsForDoctors(String doctorId){
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<Appointments> getAppointmentsForPatientByUsername(String username) {
        try {
            System.out.println("Fetching appointments for username: " + username);
            
            Optional<Patients> patient = patientRepository.findByUsername(username);
            if (!patient.isPresent()) {
                System.out.println("No patient found for username: " + username);
                return Collections.emptyList();
            }

            String patientId = patient.get().getId().toString();
            System.out.println("Found patient ID: " + patientId);

            List<Appointments> appointments = appointmentRepository.findAppointmentsByPatientId(patientId);
            System.out.println("Found " + appointments.size() + " appointments for patient");
            appointments.forEach(appointment -> 
                System.out.println("Appointment: " + appointment.toString())
            );

            return appointments;
        } catch (Exception e) {
            System.err.println("Error fetching appointments: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public List<Appointments> getAppointmentsForDoctorByUsername(String username) {
        try {
            System.out.println("Fetching appointments for doctor username: " + username);
            Optional<Doctors> doctor = doctorRepository.findByUsername(username);
            if (!doctor.isPresent()) {
                System.out.println("Doctor not found with username: " + username);
                return Collections.emptyList();
            }

            String doctorId = doctor.get().getId().toString();
            System.out.println("Found doctor ID: " + doctorId);

            List<Appointments> appointments = appointmentRepository.findByDoctorId(doctorId);
            System.out.println("Found " + appointments.size() + " appointments for doctor");
            
            // Enhance appointments with patient information
            appointments.forEach(appointment -> {
                System.out.println("Processing appointment with patientId: " + appointment.getPatientId());
                try {
                    Optional<Patients> patient = patientRepository.findById(new ObjectId(appointment.getPatientId()));
                    if (patient.isPresent()) {
                        String patientUsername = patient.get().getUsername();
                        System.out.println("Found patient username: " + patientUsername);
                        appointment.setPatientName(patientUsername);
                    } else {
                        System.out.println("Patient not found for ID: " + appointment.getPatientId());
                    }
                } catch (Exception e) {
                    System.err.println("Error processing patient for appointment: " + e.getMessage());
                }
            });

            System.out.println("Returning " + appointments.size() + " processed appointments");
            appointments.forEach(apt -> System.out.println("Appointment: patientId=" + apt.getPatientId() + ", patientName=" + apt.getPatientName()));
            return appointments;
        } catch (Exception e) {
            System.err.println("Error fetching doctor appointments: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public ResponseEntity<?> createAppointment(AppointmentsDTO request) {
        try {
            System.out.println("Creating appointment with data: " + request);

            // Get patient ID from username
            Optional<Patients> patient = patientRepository.findByUsername(request.getPatientId());
            if (!patient.isPresent()) {
                System.err.println("Patient not found with username: " + request.getPatientId());
                return new ResponseEntity<>("Patient not found", HttpStatus.BAD_REQUEST);
            }

            // Set the actual patient ID
            String patientId = patient.get().getId().toString();
            System.out.println("Using patient ID: " + patientId);

            // Validate basic input
            if (!validateBasicInput(request)) {
                return new ResponseEntity<>("Invalid input parameters", HttpStatus.BAD_REQUEST);
            }

            // Parse and validate date/time
            LocalDate date = request.getDate() != null ? LocalDate.parse(request.getDate()) : LocalDate.now();
            LocalTime time = LocalTime.parse(request.getTime());
            
            if (!isValidAppointmentTime(date, time)) {
                return new ResponseEntity<>("Invalid appointment time. Appointments must be during working hours and in the future.", HttpStatus.BAD_REQUEST);
            }

            // Validate duration
            int duration = validateAndGetDuration(request.getDurationInMinutes());
            LocalDateTime startTime = LocalDateTime.of(date, time);
            LocalDateTime endTime = startTime.plusMinutes(duration + BUFFER_TIME);

            // Check doctor availability
            if (!isDoctorAvailable(request.getDoctorId(), startTime, endTime)) {
                return new ResponseEntity<>("Doctor is not available at this time", HttpStatus.CONFLICT);
            }

            // Create appointment entity
            Appointments appointment = new Appointments();
            appointment.setPatientId(patientId);
            appointment.setDoctorId(request.getDoctorId());
            appointment.setStartTime(startTime);
            appointment.setEndTime(endTime);
            appointment.setDurationInMinutes(duration);
            appointment.setReason(request.getReason());
            appointment.setStatus(AppointmentStatus.PENDING);
            
            // Set patient name
            appointment.setPatientName(patient.get().getUsername());

            System.out.println("Saving appointment: " + appointment);
            Appointments savedAppointment = appointmentRepository.save(appointment);
            System.out.println("Saved appointment: " + savedAppointment);

            // Send notifications
            sendAppointmentNotifications(savedAppointment);

            return new ResponseEntity<>(savedAppointment, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Error creating appointment: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Failed to create appointment: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private boolean validateBasicInput(AppointmentsDTO request) {
        if (request.getPatientId() == null || request.getDoctorId() == null || 
            request.getTime() == null || request.getReason() == null || 
            request.getReason().trim().isEmpty()) {
            System.out.println("Basic validation failed: Missing required fields");
            return false;
        }

        try {
            // Parse time to validate format
            LocalTime.parse(request.getTime());
            if (request.getDate() != null) {
                LocalDate.parse(request.getDate());
            }
            return true;
        } catch (Exception e) {
            System.out.println("Basic validation failed: Invalid date/time format - " + e.getMessage());
            return false;
        }
    }

    private boolean isValidAppointmentTime(LocalDate date, LocalTime time) {
        LocalDateTime appointmentDateTime = LocalDateTime.of(date, time);
        LocalDateTime now = LocalDateTime.now();

        // Add a 5-minute buffer
        LocalDateTime minAppointmentTime = now.plusMinutes(5);

        // Check if appointment is in the future (with 5-minute buffer)
        if (appointmentDateTime.isBefore(minAppointmentTime)) {
            System.out.println("Appointment time validation failed: Must be at least 5 minutes in the future");
            return false;
        }

        // Check if appointment is during working hours (9 AM to 5 PM)
        if (time.isBefore(WORKING_HOURS_START) || time.isAfter(WORKING_HOURS_END)) {
            System.out.println("Appointment time validation failed: Must be between 9 AM and 5 PM");
            return false;
        }

        System.out.println("Appointment time validation passed");
        return true;
    }

    private int validateAndGetDuration(Integer requestedDuration) {
        if (requestedDuration == null) {
            return DEFAULT_APPOINTMENT_DURATION;
        }
        
        if (requestedDuration < MIN_APPOINTMENT_DURATION) {
            return MIN_APPOINTMENT_DURATION;
        }
        
        if (requestedDuration > MAX_APPOINTMENT_DURATION) {
            return MAX_APPOINTMENT_DURATION;
        }
        
        return requestedDuration;
    }

    private boolean isDoctorAvailable(String doctorId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Appointments> overlappingAppointments = appointmentRepository
            .findOverlappingAppointments(doctorId, startTime, endTime);
        return overlappingAppointments.isEmpty();
    }

    private void sendAppointmentNotifications(Appointments appointment) {
        try {
            ObjectId patientId = new ObjectId(appointment.getPatientId());
            Optional<Patients> patient = patientRepository.findById(patientId);
            
            if (patient.isPresent()) {
                String emailBody = String.format(
                    "Your appointment has been scheduled for %s.\nReason: %s\nStatus: %s",
                    appointment.getStartTime(),
                    appointment.getReason(),
                    appointment.getStatus()
                );
                
                emailService.sendReminder(
                    patient.get().getEmail(),
                    "Appointment Confirmation",
                    emailBody
                );
            }
        } catch (Exception e) {
            // Log error but don't stop the appointment creation process
            System.err.println("Failed to send appointment notification: " + e.getMessage());
        }
    }

    public Map<LocalDate,List<Appointments>> getAppointmentsGroupedByDate(){
        List<Appointments> all = appointmentRepository.findAll();
        return all.stream().collect(Collectors.groupingBy(a->a.getStartTime().toLocalDate()));
    }

    public Appointments updateStatus(ObjectId id, AppointmentStatus newStatus){
        return appointmentRepository.findById(id)
            .map(appointment -> {
                appointment.setStatus(newStatus);
                
                // Send notification for status change
                try {
                    ObjectId patientId = new ObjectId(appointment.getPatientId());
                    Optional<Patients> patient = patientRepository.findById(patientId);
                    
                    if (patient.isPresent()) {
                        String statusMessage = String.format(
                            "Your appointment scheduled for %s has been %s.",
                            appointment.getStartTime(),
                            newStatus.toString().toLowerCase()
                        );
                        
                        emailService.sendReminder(
                            patient.get().getEmail(),
                            "Appointment Status Update",
                            statusMessage
                        );
                    }
                } catch (Exception e) {
                    System.err.println("Failed to send status update notification: " + e.getMessage());
                }
                
                return appointmentRepository.save(appointment);
            })
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    /**
     * Checks if the appointment can be joined at the current time.
     * Allows a 5-minute buffer before and after the scheduled time.
     */
    public boolean canJoinAppointmentNow(Appointments appointment) {
        if (appointment == null || appointment.getStartTime() == null || appointment.getEndTime() == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime allowedStart = appointment.getStartTime().minusMinutes(5);
        LocalDateTime allowedEnd = appointment.getEndTime().plusMinutes(5);
        return !now.isBefore(allowedStart) && !now.isAfter(allowedEnd);
    }
}
