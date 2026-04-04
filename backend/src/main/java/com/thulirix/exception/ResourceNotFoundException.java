package com.thulirix.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ThulirixException {

    public ResourceNotFoundException(String message) {
        super(message, "RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String resourceType, Object id) {
        super(resourceType + " not found with id: " + id, "RESOURCE_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}
