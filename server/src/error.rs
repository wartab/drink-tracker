use axum::http::StatusCode;
use axum::Json;
use axum::response::{IntoResponse, Response};
use serde::Serialize;
use serde_json::json;

#[derive(Debug)]
pub struct AppError {
    pub message: String,
    pub status_code: StatusCode,
}

impl AppError {
    pub fn new<S: Into<String>>(message: S, status_code: StatusCode) -> Self {
        Self {
            message: message.into(),
            status_code,
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {

        println!("Error {}: {}", self.status_code, self.message);

        (self.status_code, Json(json!({"error": self.message}))).into_response()
    }
}

#[derive(Debug)]
pub struct DetailedAppError<V: Serialize> {
    pub message: String,
    pub status_code: StatusCode,
    pub details: V,
}

impl<V: Serialize> DetailedAppError<V> {
    pub fn new<S: Into<String>>(message: S, status_code: StatusCode, details: V) -> Self {
        Self {
            message: message.into(),
            status_code,
            details,
        }
    }
}

impl<V: Serialize> IntoResponse for DetailedAppError<V> {
    fn into_response(self) -> Response {

        println!("Error {}: {}", self.status_code, self.message);

        (self.status_code, Json(json!({"error": self.message, "details": self.details}))).into_response()
    }
}

pub trait MapToAppError<T> {
    fn map_to_server_status(self, status_code: StatusCode) -> Result<T, AppError>;
    fn map_to_not_found(self) -> Result<T, AppError>;
    fn map_to_internal_error(self) -> Result<T, AppError>;
    fn map_to_bad_request(self) -> Result<T, AppError>;
}

impl<T, E: ToString> MapToAppError<T> for Result<T, E> {
    fn map_to_server_status(self, status_code: StatusCode) -> Result<T, AppError> {
        match self {
            Ok(t) => Ok(t),
            Err(e) => Err(AppError::new(e.to_string(), status_code)),
        }
    }

    fn map_to_not_found(self) -> Result<T, AppError> {
        self.map_to_server_status(StatusCode::NOT_FOUND)
    }

    fn map_to_internal_error(self) -> Result<T, AppError> {
        self.map_to_server_status(StatusCode::INTERNAL_SERVER_ERROR)
    }

    fn map_to_bad_request(self) -> Result<T, AppError> {
        self.map_to_server_status(StatusCode::BAD_REQUEST)
    }
}
