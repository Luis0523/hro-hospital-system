package com.hro.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HroHospitalSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(HroHospitalSystemApplication.class, args);
    }
}
