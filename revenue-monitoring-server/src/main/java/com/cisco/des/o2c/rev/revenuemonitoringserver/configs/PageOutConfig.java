//package com.cisco.des.o2c.rev.revenuemonitoringserver.configs;
//
//import com.cisco.des.o2c.rev.revenuemonitoringserver.utils.EPageAccessTokenUtil;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.context.annotation.PropertySource;
//
//@Configuration
//@PropertySource("classpath:server.properties")
//public class PageOutConfig {
//    private static String apiUrl;
//    private static String alias;
//    private static String sender;
//
//    @Value("${epage.pageout.api.url}")
//    public void setApiUrl(String url) {
//        PageOutConfig.apiUrl = url;
//    }
//
//    @Value("${epage.pageout.alias}")
//    public void setAlias(String alias) {
//        PageOutConfig.alias = alias;
//    }
//
//
//    @Value("${epage.pageout.alias}")
//    public void setSender(String sender) {
//        PageOutConfig.sender = sender;
//    }
//
//
//    public static String getApiUrl() {
//        return apiUrl;
//    }
//
//    public static String getAlias() {
//        return alias;
//    }
//
//
//    public static String getSender() {
//        return sender;
//    }
//
//    public static String getToken() {
//        return EPageAccessTokenUtil.getAccessToken();
//    }
//}
