package com.example.HealthCareSystem.service;

import com.example.HealthCareSystem.entity.Message;
import com.example.HealthCareSystem.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private EmailService emailService;

    public Message sendMessage(Message message) {
        Message savedMessage = messageRepository.save(message);
        // Send email notification for new message
        // TODO: Get receiver's email from UserService
        return savedMessage;
    }

    public List<Message> getConversation(String senderId, String receiverId) {
        return messageRepository.findBySenderIdAndReceiverId(senderId, receiverId);
    }

    public List<Message> getUnreadMessages(String receiverId) {
        return messageRepository.findByReceiverIdAndIsReadFalse(receiverId);
    }

    public List<Message> getAppointmentMessages(String appointmentId) {
        return messageRepository.findByAppointmentId(appointmentId);
    }

    public Message markAsRead(String messageId) {
        return messageRepository.findById(messageId)
                .map(message -> {
                    message.setRead(true);
                    return messageRepository.save(message);
                })
                .orElseThrow(() -> new RuntimeException("Message not found"));
    }
}