package com.example.HealthCareSystem.service;

import com.example.HealthCareSystem.entity.User;
import com.example.HealthCareSystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public boolean saveNewUser(User user) {
        try {
            log.info("Attempting to save new user with data: {}", user);
            
            // Validate required fields
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                log.error("Username is required");
                return false;
            }
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                log.error("Email is required");
                return false;
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                log.error("Password is required");
                return false;
            }
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                log.error("At least one role is required");
                return false;
            }

            // Check if username or email already exists
            if (existsByUsername(user.getUsername())) {
                log.error("Username already exists: {}", user.getUsername());
                return false;
            }
            if (existsByEmail(user.getEmail())) {
                log.error("Email already exists: {}", user.getEmail());
                return false;
            }

            // Encode password
            String encodedPassword = passwordEncoder.encode(user.getPassword());
            log.debug("Password encoded successfully");
            user.setPassword(encodedPassword);

            // Ensure roles are properly formatted
            Set<String> formattedRoles = user.getRoles().stream()
                .map(role -> {
                    String upperRole = role.toUpperCase();
                    return upperRole.startsWith("ROLE_") ? upperRole : "ROLE_" + upperRole;
                })
                .collect(Collectors.toSet());
            user.setRoles(formattedRoles);

            // Save user
            log.debug("Attempting to save user to database");
            User savedUser = userRepository.save(user);
            log.info("User saved successfully with ID: {}", savedUser.getId());
            return true;
        } catch (Exception e) {
            log.error("Error saving user: {}", user, e);
            e.printStackTrace(); // Add stack trace for debugging
            return false;
        }
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public boolean existsByUsername(String username) {
        return userRepository.findByUsername(username).isPresent();
    }

    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public void deleteUser(String username) {
        try {
            log.info("Attempting to delete user: {}", username);
            userRepository.findByUsername(username)
                .ifPresent(user -> {
                    userRepository.delete(user);
                    log.info("User deleted successfully: {}", username);
                });
        } catch (Exception e) {
            log.error("Error deleting user: {}", username, e);
            throw e;
        }
    }
}
