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

	private long cmsRefresh;
	private long glRefresh;
	private long i2cRefresh;
	private long postInvoicingRefresh;
	private long revenueRefresh;

	@Autowired
	private CMSMonitoringService cmsMonitoringService;

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
	public CacheRefresh(long cmsRefresh, long glRefresh, long i2cRefresh, long postInvoicingRefresh,
			long revenueRefresh) {
		this.cmsRefresh = cmsRefresh;
		this.glRefresh = glRefresh;
		this.i2cRefresh = i2cRefresh;
		this.postInvoicingRefresh = postInvoicingRefresh;
		this.revenueRefresh = revenueRefresh;

		cacheCollection.put("cmsRefresh", cmsRefresh);
		cacheCollection.put("glRefresh", glRefresh);
		cacheCollection.put("i2cRefresh", i2cRefresh);
		cacheCollection.put("postInvoicingRefresh", postInvoicingRefresh);
		cacheCollection.put("revenueRefresh", revenueRefresh);
		startTime = new Date().getTime();
	}

	// check every 10 minutes
	@Scheduled(fixedRate = 600000)
	public void refreshCache() {

		// Prevent concurrent cache refresh operations
		if (cacheRefreshInProgress) {
			log.warn("Cache refresh already in progress, skipping this cycle");
			return;
		}

		try {
			cacheRefreshInProgress = true;
			log.info("Starting cache refresh cycle");

			for (String key : cacheCollection.keySet()) {

				long currentTime = new Date().getTime();

				if (((currentTime - startTime) / 600000) % cacheCollection.get(key) == 0) {
					log.info("Time to refresh Cache for: " + key);

					switch (key) {
						case "cmsRefresh":
							cmsMonitoringService.refreshCMSCache();
							break;
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
				} else {
					log.debug("Skip refresh Cache for: " + key);
				}
			}
		} catch (Exception e) {
			log.error("Error during cache refresh", e);
		} finally {
			cacheRefreshInProgress = false;
			log.info("Cache refresh cycle completed");
		}
	}
}
