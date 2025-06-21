package com.example.HealthCareSystem.repository;

import com.example.HealthCareSystem.entity.Appointments;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends MongoRepository<Appointments, ObjectId>{
    List<Appointments>findByPatientId(String patientId);
    List<Appointments>findByDoctorId(String doctorId);

    @Query("{ 'patientId': ?0 }")
    List<Appointments> findAppointmentsByPatientId(String patientId);

    @Query("""
            {
               "doctorId": ?0,
               "$or":[
                 {"startTime":{"$lt":?2}, "endTime":{"$gt":?1}}
               ]
            }
            """)
    List<Appointments> findOverlappingAppointments(String doctorId, LocalDateTime newStart, LocalDateTime newEnd);
    
    List<Appointments> findByStartTimeBetween(LocalDateTime from,LocalDateTime to);
    //    Optional<Appointments> findByDoctorIdAndAppointmentDate(String doctorId, LocalDateTime appointmentDate);

    @Query("{ 'doctorId': ?0, 'startTime': { $gte: ?1, $lte: ?2 } }")
    List<Appointments> findByDoctorIdAndStartTimeBetween(String doctorId, LocalDateTime start, LocalDateTime end);
}
