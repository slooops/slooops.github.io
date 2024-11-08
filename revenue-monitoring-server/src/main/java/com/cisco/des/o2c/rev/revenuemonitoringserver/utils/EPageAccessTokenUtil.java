package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import com.cisco.des.o2c.rev.revenuemonitoringserver.configs.EPageAccessTokenConfig;

import java.time.Instant;
import org.json.JSONObject;

public class EPageAccessTokenUtil {

    private static final RestTemplate restTemplate = new RestTemplate();
    private static Instant authExpirationTime = null;
    private static String accessToken = null;
    private static String tokenType = null;


    public static boolean isTokenNeeded() {
        int timeCompValue = 0;
        // TimeCompValue > 0 if current time > time in which token expired
        if (authExpirationTime != null) {
            timeCompValue = Instant.now().compareTo(authExpirationTime);
        }
        // If token is expired or expiration time was never set or accessToken was never set
        if (timeCompValue > 0 ||
                authExpirationTime == null ||
                accessToken == null) {
            return true;
        }
        else {
            return false;
        }

    }

    public static String getAccessType() {
        return tokenType;
    }

    public static String getAccessToken() {

        if (isTokenNeeded()) {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> messageBody = new LinkedMultiValueMap<String, String>();
            messageBody.add("grant_type", "client_credentials");
            messageBody.add("client_id", EPageAccessTokenConfig.getClientId());
            messageBody.add("client_secret", EPageAccessTokenConfig.getClientSecret());

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(messageBody, headers);
            String responseBody = restTemplate.postForObject(EPageAccessTokenConfig.getApiUrl(), request, String.class);
            JSONObject responseBodyJson = new JSONObject(responseBody);
            accessToken = responseBodyJson.getString("access_token");
            tokenType = responseBodyJson.getString("token_type");
            int expiresIn = responseBodyJson.getInt("expires_in");
            authExpirationTime = Instant.now().plusSeconds(expiresIn);
        }
        return accessToken;
    }

}
