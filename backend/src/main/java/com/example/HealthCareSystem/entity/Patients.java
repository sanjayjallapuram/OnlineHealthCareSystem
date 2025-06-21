package com.example.HealthCareSystem.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Document(collection = "patients")
@Data
@NoArgsConstructor
public class Patients {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    @NotBlank(message = "Username is required")
    private String username;

    @Indexed(unique = true)
    @NotBlank(message = "Email is required")
    @Email(message ="Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
    // @NonNull
    // private String confirmPassword;
    private String fullName;
    @NonNull
    private Long contactNo;
    private String dateOfBirth;
    private String gender;
    private String address;
}
    
