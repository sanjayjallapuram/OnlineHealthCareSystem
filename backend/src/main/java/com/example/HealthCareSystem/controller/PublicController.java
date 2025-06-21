package com.example.HealthCareSystem.controller;

import com.example.HealthCareSystem.Util.JwtUtil;
import com.example.HealthCareSystem.entity.User;
import com.example.HealthCareSystem.service.EmailService;
import com.example.HealthCareSystem.service.UserDetailsServiceImpl;
import com.example.HealthCareSystem.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public")
@Slf4j
public class PublicController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/mail")
    public void sendMail(@RequestBody String to){
        emailService.sendReminder("jallapuramsanjay@gmail.com","Appointment Reminder",
                "Hi, you have an appointment scheduled for + appointment.getStartTime()");
    }

    @GetMapping
    public String hello(){
        return "HEllo";
    }

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user){
        userService.saveNewUser(user);
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsServiceImpl userDetailsServiceImpl;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user){
        try{
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(),user.getPassword()));
            UserDetails userDetails = userDetailsServiceImpl.loadUserByUsername(user.getUsername());
            User fullUser = userService.findByUsername(user.getUsername());
            String jwt = jwtUtil.generateToken(userDetails.getUsername(), fullUser.getRoles());
            return new ResponseEntity<>(jwt,HttpStatus.OK);
        } catch (Exception e) {
            log.error("Exception occurred while createAuthenticationToken",e);
            return new ResponseEntity<>("Incorrect username or password", HttpStatus.BAD_REQUEST);
        }
    }

}
