package com.thulirix.exception;

import org.springframework.http.HttpStatus;

public class ThulirixException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public ThulirixException(String message) {
        super(message);
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
        this.errorCode = "THULIRIX_ERROR";
    }

    public ThulirixException(String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = status.name();
    }

    public ThulirixException(String message, String errorCode, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
