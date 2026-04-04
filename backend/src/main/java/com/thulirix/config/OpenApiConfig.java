package com.thulirix.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI thulirixOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Thulirix API")
                        .description("""
                                Enterprise Test Case Repository Platform API.

                                Provides endpoints for:
                                - Test case management (CRUD, versioning, bulk import)
                                - Execution tracking (manual + automated)
                                - Azure DevOps & Salesforce integration
                                - Requirement traceability (RTM)
                                - Reporting & analytics dashboards
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Thulirix Team")
                                .email("support@thulirix.io"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://thulirix.io/license")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token obtained from /api/v1/auth/login")));
    }
}
