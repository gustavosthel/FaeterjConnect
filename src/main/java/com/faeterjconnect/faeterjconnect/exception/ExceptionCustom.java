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

    public static class IdUserAlreadyExistsException extends RuntimeException {
        public IdUserAlreadyExistsException() {
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

