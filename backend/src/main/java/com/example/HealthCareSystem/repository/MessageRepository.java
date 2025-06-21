package com.example.HealthCareSystem.repository;

import com.example.HealthCareSystem.entity.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findBySenderIdAndReceiverId(String senderId, String receiverId);
    List<Message> findByReceiverIdAndIsReadFalse(String receiverId);
    List<Message> findByAppointmentId(String appointmentId);
} 