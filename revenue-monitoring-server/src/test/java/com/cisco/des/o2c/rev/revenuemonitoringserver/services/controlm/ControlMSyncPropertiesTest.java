package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ControlMSyncPropertiesTest {

    @Test
    void defaults_areCorrect() {
        ControlMSyncProperties props = new ControlMSyncProperties();
        assertFalse(props.isEnabled());
        assertEquals("https://ctm-p.cisco.com:8443/automation-api", props.getApiBase());
        assertFalse(props.isVerifySsl());
        assertEquals(60L, props.getPollIntervalSeconds());
        assertEquals(100, props.getFetchLimit());
        assertEquals(List.of("Ended Not OK", "Late"), props.getPollStatuses());
        assertTrue(props.getScopes().isEmpty());
    }

    @Test
    void settersAndGetters_work() {
        ControlMSyncProperties props = new ControlMSyncProperties();
        props.setEnabled(true);
        props.setApiBase("https://test-ctm:8443/api");
        props.setVerifySsl(true);
        props.setPollIntervalSeconds(120L);
        props.setFetchLimit(50);
        props.setPollStatuses(List.of("Abended"));

        assertTrue(props.isEnabled());
        assertEquals("https://test-ctm:8443/api", props.getApiBase());
        assertTrue(props.isVerifySsl());
        assertEquals(120L, props.getPollIntervalSeconds());
        assertEquals(50, props.getFetchLimit());
        assertEquals(List.of("Abended"), props.getPollStatuses());
    }

    @Test
    void scope_settersAndGetters_work() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("secret-key-123");

        assertEquals("ctmpsrv1", scope.getServer());
        assertEquals("FIN_O2C", scope.getApplication());
        assertEquals("secret-key-123", scope.getApiKey());
    }

    @Test
    void scopes_canBeAssigned() {
        ControlMSyncProperties props = new ControlMSyncProperties();
        ControlMSyncProperties.Scope s1 = new ControlMSyncProperties.Scope();
        s1.setServer("ctmpsrv1");
        s1.setApplication("FIN_O2C");
        s1.setApiKey("key1");

        ControlMSyncProperties.Scope s2 = new ControlMSyncProperties.Scope();
        s2.setServer("ctmpsrv2");
        s2.setApplication("FIN_I2C");
        s2.setApiKey("key2");

        props.setScopes(List.of(s1, s2));
        assertEquals(2, props.getScopes().size());
        assertEquals("ctmpsrv2", props.getScopes().get(1).getServer());
    }
}
