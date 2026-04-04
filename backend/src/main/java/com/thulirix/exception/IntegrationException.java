package com.thulirix.exception;

import org.springframework.http.HttpStatus;

public class IntegrationException extends ThulirixException {

    public IntegrationException(String message) {
        super(message, "INTEGRATION_ERROR", HttpStatus.BAD_GATEWAY);
    }

    public IntegrationException(String message, String errorCode) {
        super(message, errorCode, HttpStatus.BAD_GATEWAY);
    }

    public IntegrationException(String message, Throwable cause) {
        super(message, "INTEGRATION_ERROR", HttpStatus.BAD_GATEWAY);
        initCause(cause);
    }
}
