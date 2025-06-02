package com.cisco.des.o2c.rev.revenuemonitoringserver.scheduler;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.CMSMonitoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;

@Component
public class CacheRefresh {

	private static final Logger log = LoggerFactory.getLogger(CacheRefresh.class);
	private static final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss");
	private static long startTime = 0;
	
	private long cmsRefresh;
	
	@Autowired
    private CMSMonitoringService cmsMonitoringService;
	
	private HashMap<String,Long > cacheCollection = new HashMap<String,Long>();
	
	@Autowired
	public CacheRefresh(long cmsRefresh)
	{
		this.cmsRefresh = cmsRefresh;
		
		cacheCollection.put("cmsRefresh", cmsRefresh);
		startTime = new Date().getTime();
	}
	
	//check every 50
	@Scheduled(fixedRate = 50000)
	public void refreshCache() {
		//log.info("The time is now {}", dateFormat.format(new Date()));
		//log.info("Check the file and what needs to be refreshed " + cmsRefresh);
		
		for (String key : cacheCollection.keySet()) {
			 
			long currentTime = new Date().getTime();
			
			/* 
			log.info("****************");
			log.info("currentTime " + currentTime);
			log.info("startTime " + startTime);
			log.info("cacheCollection.get(key) " + cacheCollection.get(key));
			log.info("((currentTime) - (startTime)) / cacheCollection.get(key)" 
					+ ((currentTime) - (startTime)) / cacheCollection.get(key));
			*/
			
			if( ((currentTime - startTime)/10000) % cacheCollection.get(key) == 0 ) {
				log.info("Time to refresh Cache");
				
				switch(key) {
					case "cmsRefresh":
						cmsMonitoringService.refreshCMSCache(); 
						break;
					case "anythingElse":
						break;
					default:
						
				}
			}
			else {
				log.info("Skip refresh Cache");
			}
		}
	}
}
