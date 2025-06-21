package com.example.HealthCareSystem.controller;

import com.example.HealthCareSystem.entity.Message;
import com.example.HealthCareSystem.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {
        return ResponseEntity.ok(messageService.sendMessage(message));
    }

    @GetMapping("/conversation/{receiverId}")
    public ResponseEntity<List<Message>> getConversation(
            Authentication authentication,
            @PathVariable String receiverId) {
        String senderId = authentication.getName();
        return ResponseEntity.ok(messageService.getConversation(senderId, receiverId));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Message>> getUnreadMessages(Authentication authentication) {
        String receiverId = authentication.getName();
        return ResponseEntity.ok(messageService.getUnreadMessages(receiverId));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<Message>> getAppointmentMessages(@PathVariable String appointmentId) {
        return ResponseEntity.ok(messageService.getAppointmentMessages(appointmentId));
    }

    @PostMapping("/{messageId}/read")
    public ResponseEntity<Message> markMessageAsRead(@PathVariable String messageId) {
        return ResponseEntity.ok(messageService.markAsRead(messageId));
    }
} 