package com.example.HealthCareSystem.entity;

import com.mongodb.lang.NonNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "doctors")
@Data
@NoArgsConstructor
public class Doctors {
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
    // private String confirmPassword;
    @NonNull
    private Long contactNo;
    private String fullName;
    @NonNull
    private String specialty;
    private String qualification;
    private int yearsOfExperience;
    private String bio;
    private List<String> languages = new ArrayList<>();
    private List<WorkingHours> workingHours = new ArrayList<>();
    private double averageRating;
    private int numberOfReviews;
    // private List<Review> reviews = new ArrayList<>();
    private boolean isAvailable = true;
    private String phoneNumber;
    private String address;
    private List<String> certifications = new ArrayList<>();


    public String getId() {
        return id != null ? id.toString() : null;
    }

    public void setId(ObjectId id) {
        this.id = id;
    }

    @Override
    public String toString() {
        return "Doctor{" +
                "id='" + id + '\'' +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", contactNo=" + contactNo +
                '}';
    }
}
