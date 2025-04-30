 package com.cisco.des.o2c.rev.revenuemonitoringserver.utils;

 import org.apache.tomcat.util.codec.binary.Base64;
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
 // If token is expired or expiration time was never set or accessToken was
// never set
 if (timeCompValue > 0 || authExpirationTime == null || accessToken == null) {
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

 // Add Authorization header with Basic Authentication
 String clientId = "RevI2cOpsMonitoring";
 String clientSecret = "0ybw2IfD6XyFHHy5UIkbAbgR6g7aK-p1aJIkYLf-_GX0g2xdYtP7a3l4dpPq3qhO";
 String credentials = clientId + ":" + clientSecret;
 String base64Credentials = new String(Base64.encodeBase64(credentials.getBytes()));
 headers.add("Authorization", "Basic " + base64Credentials);

 // Set grant_type in the body
 MultiValueMap<String, String> messageBody = new LinkedMultiValueMap<>();
 messageBody.add("grant_type", "client_credentials");

 HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(messageBody, headers);

 // Make the request
 String responseBody =
 restTemplate.postForObject("https://id.cisco.com/oauth2/default/v1/token", request, String.class);
 JSONObject responseBodyJson = new JSONObject(responseBody);
 accessToken = responseBodyJson.getString("access_token");
 tokenType = responseBodyJson.getString("token_type");
 int expiresIn = responseBodyJson.getInt("expires_in");
 authExpirationTime = Instant.now().plusSeconds(expiresIn);
 }
 return accessToken;
 }

 }
