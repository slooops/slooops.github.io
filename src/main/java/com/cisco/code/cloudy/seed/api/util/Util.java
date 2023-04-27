package com.cisco.code.cloudy.seed.api.util;

import com.cisco.code.cloudy.seed.api.pojo.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.joda.time.DateTime;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Defines helper/util methods that performs common functions which
 * doesn't depend on the state of the object.
 *
 * @author sujmuthu
 * @version 1.0
 */
public class Util {

    private static final Logger LOGGER = LoggerFactory.getLogger(Util.class);

    private Util() {

    }

    /**
     * Determines whether the given string is a null or an empty string
     *
     * @param value The input value to be checked
     * @return true/false
     */
    public static Boolean isNullOrEmpty(String value) {
        return value == null || value.trim().length() == 0;
    }

    /**
     * Constructs API response object with custom attributes
     *
     * @param status
     * @param data
     * @param code
     * @param errorMessage
     * @return
     */
    public static ApiResponse constructResponse(Constants.Status status, Object data, Integer code, String errorMessage) {
        return new ApiResponse(status.name(), data, new ApiResponse.Error(code, errorMessage));
    }

    /**
     * Constructs API response object with custom attributes
     *
     * @param status
     * @param code
     * @param errorMessage
     * @return
     */
    public static ApiResponse constructResponse(Constants.Status status, Integer code, String errorMessage) {
        return new ApiResponse(status.name(), null, new ApiResponse.Error(code, errorMessage));
    }

    /**
     * Constructs API response object with custom attributes
     *
     * @param status
     * @param data
     * @return
     */
    public static ApiResponse constructResponse(Constants.Status status, Object data) {
        return new ApiResponse(status.name(), data, null);
    }

    /**
     * Decrypts the password using the Jasypt library
     *
     * @param password the encrypted password
     * @param key      key to run the decryption algorithm
     * @return decrypted password
     */
    public static String decrypt(String password, String key) {
        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        String encryptedPassword = null;
        encryptor.setPassword(key);
        try {
            if (!Util.isNullOrEmpty(password)) {
                LOGGER.debug("Decrypting the password: {}", password);
                encryptedPassword = encryptor.decrypt(password);
                LOGGER.debug("Encrypted Password: {}", encryptedPassword);
            }
        } catch (Exception e) {
            LOGGER.error("Error occurred while decrypting password", e);
        }
        return encryptedPassword;
    }

    public static Date utcDate(Date date) {
        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        try {
            return dateFormat.parse(dateFormat.format(date));
        } catch (ParseException ex) {
            // Should not reach here
            LOGGER.error("An error occurred when parsing current date to UTC format", ex);
        }
        return date;
    }

    /**
     * Convert dates stored as String or Milliseconds to Date Time in UTC Format
     *
     * @param data
     * @return
     */
    private static Map<String, Object> convertMillisecondsToDateTimes(Map<String, Object> data) {
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            // Iterate through hash map and reset date attribute values
            try {
                if (entry.getValue() instanceof Map) {
                    Map<String, Object> value = new ObjectMapper().convertValue(entry.getValue(), new TypeReference<Object>() {
                    });
                    data.put(entry.getKey(), convertMillisecondsToDateTimes(value));
                }
                if (entry.getValue() instanceof List) {
                    List<Map<String, Object>> list = new ObjectMapper().convertValue(entry.getValue(), new TypeReference<List<Map<String, Object>>>() {
                    });
                    data.put(entry.getKey(), convertMillisecondsToDateTimes(list));
                }
            } catch (Exception e) {
                LOGGER.info("not supported type");
                LOGGER.debug("not supported type", e);
            }

            // Date shouldn't be stored as a string or in milliseconds
            if (containsDateInCamelCase(entry.getKey())) {
                try {
                    data.put(entry.getKey(), new DateTime(entry.getValue()).toDate());
                } catch (Exception ex) {
                    LOGGER.info("The timestamp is sent as unix timestamp, so converting it to milliseconds", ex);
                    Integer evenTimestamp = (Integer) entry.getValue();
                    Long toLong = evenTimestamp * 1000L;
                    data.put(entry.getKey(), new DateTime(toLong).toDate());
                }
            }
        }
        return data;
    }


    private static List<Map<String, Object>> convertMillisecondsToDateTimes(List<Map<String, Object>> list) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map<String, Object> item : list) {
            items.add(convertMillisecondsToDateTimes(item));
        }
        return items;
    }

    private static boolean containsDateInCamelCase(String camelCaseKey) {
        List<String> wordList = Arrays.asList(camelCaseKey.split("(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])"));
        for (String word : wordList) {
            if ("date".equalsIgnoreCase(word) || "timestamp".equalsIgnoreCase(word)) {
                return true;
            }
        }
        return false;
    }
}