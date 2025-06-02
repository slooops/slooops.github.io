package com.cisco.des.o2c.rev.revenuemonitoringserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class RevenueMonitoringServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(RevenueMonitoringServerApplication.class, args);
	}

}
