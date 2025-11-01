package com.faeterjconnect.faeterjconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class FaeterjConnectApplication {

	public static void main(String[] args) {
		SpringApplication.run(FaeterjConnectApplication.class, args);
	}

}
