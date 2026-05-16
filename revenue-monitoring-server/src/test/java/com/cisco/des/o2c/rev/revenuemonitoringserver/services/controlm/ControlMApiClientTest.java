package com.cisco.des.o2c.rev.revenuemonitoringserver.services.controlm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ControlMApiClientTest {

    @Mock
    private WebClient webClient;
    @Mock
    private WebClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;
    @Mock
    private WebClient.RequestHeadersSpec<?> requestHeadersSpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;

    private ControlMSyncProperties props;
    private ControlMApiClient apiClient;

    @BeforeEach
    void setUp() {
        props = new ControlMSyncProperties();
        props.setApiBase("https://ctm-test.example.com:8443/automation-api");
        props.setVerifySsl(false);
        props.setPollStatuses(List.of("Ended Not OK", "Late"));
        props.setFetchLimit(50);

        // Build the client with a real props object but we'll inject a mock WebClient
        // via reflection
        apiClient = new ControlMApiClient(props);
        // Replace the internal WebClient with our mock
        try {
            var field = ControlMApiClient.class.getDeclaredField("webClient");
            field.setAccessible(true);
            field.set(apiClient, webClient);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void fetchAllScopes_skipsScope_whenApiKeyIsBlank() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey(""); // blank key
        props.setScopes(List.of(scope));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertTrue(result.isEmpty());
        verifyNoInteractions(webClient);
    }

    @Test
    void fetchAllScopes_skipsScope_whenApiKeyIsNull() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey(null);
        props.setScopes(List.of(scope));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertTrue(result.isEmpty());
        verifyNoInteractions(webClient);
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_parsesSuccessfulResponse() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("test-api-key");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Ended Not OK"));

        Map<String, Object> item = Map.of(
                "jobId", "ctmpsrv1:abc123",
                "name", "FIN_REVENUE_DAILY",
                "application", "FIN_O2C",
                "subApplication", "REV_CLOSE",
                "returnCode", "1",
                "server", "ctmpsrv1",
                "orderDate", "260415",
                "startTime", "2026/04/15 09:31:45",
                "endTime", "2026/04/15 09:35:12");
        Map<String, Object> body = Map.of("statuses", List.of(item));

        // Mock the WebClient chain
        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class)).thenReturn(Mono.just(body));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();

        assertEquals(1, result.size());
        ControlMAlertRow row = result.get(0);
        assertEquals("ctmpsrv1:abc123", row.ctmJobId());
        assertEquals("FIN_REVENUE_DAILY", row.jobName());
        assertEquals("FIN_O2C", row.application());
        assertEquals("REV_CLOSE", row.subApplication());
        assertEquals(1, row.returnCode());
        assertEquals("FAILED", row.alertType()); // "Ended Not OK" → FAILED
        assertEquals("ctmpsrv1", row.server());
        assertNotNull(row.orderDate());
        assertNotNull(row.startTime());
        assertNotNull(row.endTime());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_skipsItemsWithoutJobId() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("test-api-key");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Late"));

        // Item with no jobId at all
        Map<String, Object> item = Map.of(
                "name", "orphan_job",
                "application", "FIN_O2C");
        Map<String, Object> body = Map.of("statuses", List.of(item));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class)).thenReturn(Mono.just(body));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertTrue(result.isEmpty());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_handlesNullBody() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("test-api-key");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Ended Not OK"));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class)).thenReturn(Mono.just(Map.of())); // no "statuses" key

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertTrue(result.isEmpty());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_continuesOnException() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("test-api-key");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Ended Not OK", "Late"));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        // First call throws, second call succeeds
        when(respSpec.bodyToMono(Map.class))
                .thenThrow(new RuntimeException("Connection refused"))
                .thenReturn(Mono.just(Map.of("statuses", List.of(
                        Map.of("jobId", "srv:999", "name", "survivor")))));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertEquals(1, result.size());
        assertEquals("srv:999", result.get(0).ctmJobId());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_mapsLateStatus_toDelayed() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv2");
        scope.setApplication("FIN_I2C");
        scope.setApiKey("key2");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Late"));

        Map<String, Object> item = Map.of("jobId", "srv:late1", "name", "late_job");
        Map<String, Object> body = Map.of("statuses", List.of(item));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class)).thenReturn(Mono.just(body));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertEquals(1, result.size());
        assertEquals("DELAYED", result.get(0).alertType());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_usesFallbackServer_fromCtmField() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("key");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Ended Not OK"));

        // "server" missing but "ctm" present
        Map<String, Object> item = Map.of(
                "jobId", "srv:fallback1",
                "name", "test_job",
                "ctm", "ctmpsrv_from_api");
        Map<String, Object> body = Map.of("statuses", List.of(item));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class)).thenReturn(Mono.just(body));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertEquals("ctmpsrv_from_api", result.get(0).server());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_usesLowercaseFieldAlternatives() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("key");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Ended Not OK"));

        // Use lowercase field names (CTM API sometimes returns these)
        Map<String, Object> item = Map.of(
                "jobid", "srv:lower1",
                "jobName", "lower_job",
                "subapplication", "SUB_APP",
                "returncode", "42",
                "starttime", "2026-04-15T10:00:00",
                "endtime", "2026-04-15T10:05:00",
                "orderdate", "20260415");
        Map<String, Object> body = Map.of("statuses", List.of(item));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class)).thenReturn(Mono.just(body));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertEquals(1, result.size());
        ControlMAlertRow row = result.get(0);
        assertEquals("srv:lower1", row.ctmJobId());
        assertEquals("SUB_APP", row.subApplication());
        assertEquals(42, row.returnCode());
        assertNotNull(row.startTime());
        assertNotNull(row.endTime());
        assertNotNull(row.orderDate());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_handlesMultipleScopes() {
        ControlMSyncProperties.Scope scope1 = new ControlMSyncProperties.Scope();
        scope1.setServer("ctmpsrv1");
        scope1.setApplication("FIN_O2C");
        scope1.setApiKey("key1");

        ControlMSyncProperties.Scope scope2 = new ControlMSyncProperties.Scope();
        scope2.setServer("ctmpsrv2");
        scope2.setApplication("FIN_I2C");
        scope2.setApiKey("key2");

        props.setScopes(List.of(scope1, scope2));
        props.setPollStatuses(List.of("Ended Not OK"));

        Map<String, Object> body1 = Map.of("statuses", List.of(Map.of("jobId", "srv1:j1", "name", "job1")));
        Map<String, Object> body2 = Map.of("statuses", List.of(Map.of("jobId", "srv2:j2", "name", "job2")));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class))
                .thenReturn(Mono.just(body1))
                .thenReturn(Mono.just(body2));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertEquals(2, result.size());
    }

    @Test
    void fetchAllScopes_emptyScopes_returnsEmptyList() {
        props.setScopes(List.of());
        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertTrue(result.isEmpty());
    }

    @SuppressWarnings("unchecked")
    @Test
    void fetchAllScopes_handlesNullReturnCode() {
        ControlMSyncProperties.Scope scope = new ControlMSyncProperties.Scope();
        scope.setServer("ctmpsrv1");
        scope.setApplication("FIN_O2C");
        scope.setApiKey("key");
        props.setScopes(List.of(scope));
        props.setPollStatuses(List.of("Ended Not OK"));

        // returnCode absent
        Map<String, Object> item = Map.of("jobId", "srv:rc1", "name", "no_rc");
        Map<String, Object> body = Map.of("statuses", List.of(item));

        WebClient.RequestHeadersUriSpec uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec respSpec = mock(WebClient.ResponseSpec.class);

        when(webClient.get()).thenReturn(uriSpec);
        when(uriSpec.uri(any(Function.class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(respSpec);
        when(respSpec.bodyToMono(Map.class)).thenReturn(Mono.just(body));

        List<ControlMAlertRow> result = apiClient.fetchAllScopes();
        assertEquals(1, result.size());
        assertNull(result.get(0).returnCode());
    }
}
