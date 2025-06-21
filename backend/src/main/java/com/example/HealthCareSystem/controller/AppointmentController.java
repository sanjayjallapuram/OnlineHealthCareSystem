package com.example.HealthCareSystem.controller;

import com.example.HealthCareSystem.entity.Appointments;
import com.example.HealthCareSystem.entity.AppointmentsDTO;
import com.example.HealthCareSystem.enums.AppointmentStatus;
import com.example.HealthCareSystem.repository.AppointmentRepository;
import com.example.HealthCareSystem.service.AppointmentService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/appointments")

public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody AppointmentsDTO request){
        return appointmentService.createAppointment(request);
    }

    @GetMapping
    public ResponseEntity<?> getAllAppointments(){
        List<Appointments> all=appointmentService.getAllAppointments();
        if(all!=null){
            return new ResponseEntity<>(all, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointments> getAppointmentsForPatients(@PathVariable String patientId){
        return appointmentService.getAppointmentsForPatient(patientId);
    }

    @GetMapping("/patient/name/{username}")
    public List<Appointments> getAppointmentsForPatientByUsername(@PathVariable String username){
        return appointmentService.getAppointmentsForPatientByUsername(username);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Appointments> getAppointmentsForDoctors(@PathVariable String doctorId){
        return appointmentService.getAppointmentsForDoctors(doctorId);
    }

    @GetMapping("/doctor/name/{username}")
    public List<Appointments> getAppointmentsForDoctorByUsername(@PathVariable String username){
        return appointmentService.getAppointmentsForDoctorByUsername(username);
    }

    @GetMapping("/grouped-by-date")
    public Map<LocalDate,List<Appointments>> getAppointmentsGroupedByDate(){
        return appointmentService.getAppointmentsGroupedByDate();
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable ObjectId id){
        Appointments appointments = appointmentService.updateStatus(id, AppointmentStatus.CONFIRMED);
        return new ResponseEntity<>(appointments,HttpStatus.OK);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable String id) {
        try {
            Appointments cancelledAppointment = appointmentService.updateStatus(new ObjectId(id), AppointmentStatus.CANCELLED);
            return ResponseEntity.ok(cancelledAppointment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to cancel appointment: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable ObjectId id){
        Appointments appointments = appointmentService.updateStatus(id, AppointmentStatus.COMPLETED);
        return new ResponseEntity<>(appointments,HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable String id) {
        try {
            Optional<Appointments> appointment = appointmentRepository.findById(new ObjectId(id));
            if (appointment.isPresent()) {
                return ResponseEntity.ok(appointment.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching appointment: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/can-join")
    public ResponseEntity<?> canJoinAppointment(@PathVariable String id) {
        try {
            Optional<Appointments> appointmentOpt = appointmentRepository.findById(new ObjectId(id));
            if (!appointmentOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Appointment not found");
            }
            boolean canJoin = appointmentService.canJoinAppointmentNow(appointmentOpt.get());
            return ResponseEntity.ok(Collections.singletonMap("canJoin", canJoin));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error checking appointment join time: " + e.getMessage());
        }
    }

}
