package IUH.KLTN.LvsH.backend_refactor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class BackendRefactorApplication {

	public static void main(String[] args) {

		 // Load tệp .env vào System properties
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		
		SpringApplication.run(BackendRefactorApplication.class, args);
	}

}
