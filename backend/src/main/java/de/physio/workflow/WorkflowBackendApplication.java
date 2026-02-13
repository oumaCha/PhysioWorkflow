package de.physio.workflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "de.physio.workflow")
public class WorkflowBackendApplication {
	public static void main(String[] args) {
		SpringApplication.run(WorkflowBackendApplication.class, args);
	}
}
