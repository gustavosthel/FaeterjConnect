package com.faeterjconnect.faeterjconnect.exception;

public class ExceptionCustom {

    public static class EmailAlreadyExistsException extends RuntimeException {
        public EmailAlreadyExistsException() {
        }
    }

    public static class AdminAlreadyExistsException extends RuntimeException {
        public AdminAlreadyExistsException() {
        }
    }

    public static class BadCredentialsException extends RuntimeException {
        public BadCredentialsException() {
        }
    }

    public static class InvalidUserException extends RuntimeException {
        public InvalidUserException() {
        }
    }

    public static class InvalidRoleException extends RuntimeException {
        public InvalidRoleException() {
        }
    }

    public static class PostNotExistsException extends RuntimeException {
        public PostNotExistsException() {
        }
    }

    public static class PostNotYoursException extends RuntimeException {
        public PostNotYoursException() {
        }
    }

    public static class CommentNotYoursException extends RuntimeException {
        public CommentNotYoursException() {
        }
    }

    public static class CommentNotExistsException extends RuntimeException {
        public CommentNotExistsException() {
        }
    }

    public static class PostNotFoundException extends RuntimeException {
        public PostNotFoundException() {
        }
    }

    public static class UserNotAuthorizeException extends RuntimeException {
        public UserNotAuthorizeException() {
        }
    }

    public static class CommentedNotFoundException extends RuntimeException {
        public CommentedNotFoundException() {
        }
    }

}

