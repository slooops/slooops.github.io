package com.cisco.code.cloudy.seed.api.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Custom API response object which encapsulates status, result and error information
 *
 * @author sujmuthu
 * @version 1.0
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApiResponse {

    private String status;
    private Object data;
    private Error error;

    public ApiResponse(String status, Object data, Error error) {
        this.status = status;
        this.data = data;
        this.error = error;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public Error getError() {
        return error;
    }

    public void setError(Integer code, String message) {
        if (code == null && message == null) {
            this.error = null;
        } else {
            this.error = new Error(code, message);
        }
    }

    @Override
    public String toString() {
        return "APIResponse{" +
                "status='" + status + '\'' +
                ", data='" + data + '\'' +
                ", error=" + error +
                '}';
    }

    //inner class for error
    public static class Error {
        private final Integer code;
        private final String message;

        public Error(Integer code, String message) {
            this.code = code;
            this.message = message;
        }


        public Integer getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        @Override
        public String toString() {
            return "Error{" +
                    "code='" + code + '\'' +
                    ", message='" + message + '\'' +
                    "}";
        }
    }
}