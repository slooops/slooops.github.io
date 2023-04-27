package com.cisco.code.cloudy.seed.api.controller;

import com.cisco.code.cloudy.seed.api.pojo.ApiResponse;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author sujmuthu
 * @version 1.0
 */
@RestController
@RequestMapping
public class GreetingsController {

    /**
     * Echos the request parameter value
     *
     * @param name The value to be returned as a response
     * @return Returns the name entered
     */
    @GetMapping(value = "/echo/test")
    public String echo() {
        return "test";
    }
}
