package com.cisco.des.o2c.rev.revenuemonitoringserver.scheduler;

import com.cisco.des.o2c.rev.revenuemonitoringserver.services.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.lang.reflect.Field;

import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CacheRefresh} focusing on the conditional refresh logic.
 * We do NOT rely on Spring here – we construct the object directly, inject mocks
 * via reflection and manipulate the internal static startTime to make the
 * ( (currentTime - startTime)/10000 ) % interval == 0 expression deterministic.
 */
class CacheRefreshTest {

    private GLPostingMonitoringService glService;
    private InvoiceToCashMonitoringService i2cService;
    private PostInvoicingMonitoringService postInvService;
    private RevenueAccountingMonitoringService revenueService;

    @BeforeEach
    void setUp() {
        glService = Mockito.mock(GLPostingMonitoringService.class);
        i2cService = Mockito.mock(InvoiceToCashMonitoringService.class);
        postInvService = Mockito.mock(PostInvoicingMonitoringService.class);
        revenueService = Mockito.mock(RevenueAccountingMonitoringService.class);
    }

    /**
     * With all refresh intervals = 1 and startTime pushed 10s into the past,
     * integer division (delta/10000) == 1, therefore 1 % 1 == 0 for every key
     * and each service refresh method should be invoked once.
     */
    @Test
    void refreshCache_triggersAllServices_whenModuloConditionMatches() throws Exception {
        CacheRefresh cacheRefresh = new CacheRefresh(1,1,1,1);
        injectServices(cacheRefresh);
        // Force startTime so that (current - startTime)/10000 == 1
        setStaticStartTime(System.currentTimeMillis() - 10_000L);

        cacheRefresh.refreshCache();

        verify(glService, times(1)).refreshGlPostingMonitoringCache();
        verify(i2cService, times(1)).refreshInvoiceToCashMonitoringCache();
        verify(postInvService, times(1)).refreshPostInvoicingMonitoringCache();
        verify(revenueService, times(1)).refreshRevenueAccountingMonitoringCache();
        verifyNoMoreInteractions(glService, i2cService, postInvService, revenueService);
    }

    /**
     * With all refresh intervals = 2 and startTime pushed 10s into the past,
     * integer division (delta/10000) == 1, therefore 1 % 2 != 0 and no service
     * refresh methods should fire.
     */
    @Test
    void refreshCache_skipsAllServices_whenModuloConditionNotMet() throws Exception {
        CacheRefresh cacheRefresh = new CacheRefresh(2,2,2,2);
        injectServices(cacheRefresh);
        setStaticStartTime(System.currentTimeMillis() - 10_000L);

        cacheRefresh.refreshCache();

        verifyNoInteractions(glService, i2cService, postInvService, revenueService);
    }

    // --- Helper methods ---------------------------------------------------

    private void injectServices(CacheRefresh target) throws Exception {
        setField(target, "glPostingMonitoringService", glService);
        setField(target, "invoiceToCashMonitoringService", i2cService);
        setField(target, "postInvoicingMonitoringService", postInvService);
        setField(target, "revenueAccountingMonitoringService", revenueService);
    }

    private void setField(Object target, String name, Object value) throws Exception {
        Field f = CacheRefresh.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(target, value);
    }

    private void setStaticStartTime(long value) throws Exception {
        Field f = CacheRefresh.class.getDeclaredField("startTime");
        f.setAccessible(true);
        f.setLong(null, value);
    }
}
