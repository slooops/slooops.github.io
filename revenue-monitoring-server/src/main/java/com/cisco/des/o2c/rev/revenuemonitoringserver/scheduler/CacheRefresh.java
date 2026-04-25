package com.cisco.des.o2c.rev.revenuemonitoringserver.scheduler;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.*;
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

	private long glRefresh;
	private long i2cRefresh;
	private long postInvoicingRefresh;
	private long revenueRefresh;

	@Autowired
	private GLPostingMonitoringService glPostingMonitoringService;

	@Autowired
	private InvoiceToCashMonitoringService invoiceToCashMonitoringService;

	@Autowired
	private PostInvoicingMonitoringService postInvoicingMonitoringService;

	@Autowired
	private RevenueAccountingMonitoringService revenueAccountingMonitoringService;

	private HashMap<String, Long> cacheCollection = new HashMap<String, Long>();

	// Add flag to prevent concurrent cache refreshes
	private volatile boolean cacheRefreshInProgress = false;

	@Autowired
	public CacheRefresh(long glRefresh, long i2cRefresh, long postInvoicingRefresh,
			long revenueRefresh) {
		this.glRefresh = glRefresh;
		this.i2cRefresh = i2cRefresh;
		this.postInvoicingRefresh = postInvoicingRefresh;
		this.revenueRefresh = revenueRefresh;

		cacheCollection.put("glRefresh", glRefresh);
		cacheCollection.put("i2cRefresh", i2cRefresh);
		cacheCollection.put("postInvoicingRefresh", postInvoicingRefresh);
		cacheCollection.put("revenueRefresh", revenueRefresh);
		startTime = new Date().getTime();
	}

	// check every 10 minutes
	@Scheduled(fixedRate = 600000)
	public void refreshCache() {

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
					case "glRefresh":
						glPostingMonitoringService.refreshGlPostingMonitoringCache();
						break;
					case "i2cRefresh":
						invoiceToCashMonitoringService.refreshInvoiceToCashMonitoringCache();
						break;
					case "postInvoicingRefresh":
						postInvoicingMonitoringService.refreshPostInvoicingMonitoringCache();
						break;
					case "revenueRefresh":
						revenueAccountingMonitoringService.refreshRevenueAccountingMonitoringCache();
						break;
					case "anythingElse":
						break;
					default:
						break;
				}
			}
			else {
				log.info("Skip refresh Cache");
			}
		}
	}
}
