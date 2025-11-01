package com.faeterjconnect.faeterjconnect.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// WebConfig.java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.media.local-path}")
    private String mediaLocalPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/media/**")
                .addResourceLocations("file:" + mediaLocalPath + "/")
                .setCachePeriod(31536000); // cache 1 ano
    }
}