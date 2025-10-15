package com.faeterjconnect.faeterjconnect.exception;

import com.faeterjconnect.faeterjconnect.dto.ExceptionDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.validation.FieldError;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ControllerExceptionHanddler extends ExceptionCustom {


//    @ExceptionHandler(BadCredentialsException.class)
//    public ResponseEntity incorrectCredentials(BadCredentialsException exception) {
//        ExceptionDTO exceptionDTO = new ExceptionDTO("Email or Password incorrect", "401");
//        return new ResponseEntity(exceptionDTO, HttpStatus.UNAUTHORIZED);
//    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity handleEmailAlreadyExists(EmailAlreadyExistsException exception) {
        ExceptionDTO exceptionDTO = new ExceptionDTO("Email already exists", "400");
        return new ResponseEntity(exceptionDTO, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AdminAlreadyExistsException.class)
    public ResponseEntity handleAdminAlreadyExists(AdminAlreadyExistsException exception) {
        ExceptionDTO exceptionDTO = new ExceptionDTO("Admin already exists", "400");
        return new ResponseEntity(exceptionDTO, HttpStatus.BAD_REQUEST);
    }

//    @ExceptionHandler(IdUserAlreadyExistsException.class)
//    public ResponseEntity handleIdUserAlreadyExists(IdUserAlreadyExistsException exception) {
//        ExceptionDTO exceptionDTO = new ExceptionDTO("User id not found", "404");
//        return new ResponseEntity(exceptionDTO, HttpStatus.NOT_FOUND);
//    }
//
//    @ExceptionHandler(MethodArgumentNotValidException.class)
//    public ResponseEntity<ExceptionDTO> handleValidationErrors(MethodArgumentNotValidException exception) {
//        List<String> errors = exception.getBindingResult().getFieldErrors()
//                .stream()
//                .map(FieldError::getDefaultMessage)
//                .collect(Collectors.toList());
//
//        String errorMessage = String.join(", ", errors);
//        ExceptionDTO exceptionDTO = new ExceptionDTO(errorMessage, "400");
//        return new ResponseEntity<>(exceptionDTO, HttpStatus.BAD_REQUEST);
//    }

//    @ExceptionHandler(Exception.class)
//    public ResponseEntity handleExceptionGeneral(Exception exception) {
//        ExceptionDTO exceptionDTO = new ExceptionDTO("Internal Server Error", "500");
//        return new ResponseEntity(exceptionDTO, HttpStatus.INTERNAL_SERVER_ERROR);
//    }
//
//    @ExceptionHandler(PostNotFoundException.class)
//    public ResponseEntity postNotFoundException(PostNotFoundException exception) {
//        ExceptionDTO exceptionDTO = new ExceptionDTO("Post not found", "404");
//        return new ResponseEntity(exceptionDTO, HttpStatus.NOT_FOUND);
//    }
//
//    @ExceptionHandler(UserNotAuthorizeException.class)
//    public ResponseEntity userNotAuthorizeException(UserNotAuthorizeException exception) {
//        ExceptionDTO exceptionDTO = new ExceptionDTO("User not authorize", "403");
//        return new ResponseEntity(exceptionDTO, HttpStatus.FORBIDDEN);
//    }
//
//    @ExceptionHandler(CommentedNotFoundException.class)
//    public ResponseEntity commentedNotFoundException(CommentedNotFoundException exception) {
//        ExceptionDTO exceptionDTO = new ExceptionDTO("Commented not found", "404");
//        return new ResponseEntity(exceptionDTO, HttpStatus.NOT_FOUND);
//    }
}
