package com.example.HealthCareSystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
@EnableScheduling
public class HealthCareSystemApplication implements WebMvcConfigurer {
	public static void main(String[] args) {
		SpringApplication.run(HealthCareSystemApplication.class, args);
		System.out.println("Welcome to Online HealthCare System");
	}


}
