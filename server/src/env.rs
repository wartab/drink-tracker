use std::env;
use std::net::SocketAddr;
use jsonwebtoken::{DecodingKey, EncodingKey};

const VAR_APP_SECRET: &str = "APP_SECRET";
const VAR_DB_CONNECTION_STRING: &str = "DB_CONNECTION_STRING";
const VAR_LISTEN_ADDRESS_PORT: &str = "LISTEN_ADDRESS_PORT";

#[derive(thiserror::Error, Debug)]
pub enum EnvError {
    #[error("Failed to parse {VAR_APP_SECRET}")]
    AppSecret,

    #[error("Failed to parse {VAR_DB_CONNECTION_STRING}")]
    DbConnectionString,

    #[error("Failed to parse {VAR_LISTEN_ADDRESS_PORT}")]
    ListenAddressPort,
}

pub fn app_secret() -> Result<(EncodingKey, DecodingKey), EnvError> {
    env::var(VAR_APP_SECRET)
        .map(|app_secret| (
            EncodingKey::from_base64_secret(&app_secret).unwrap(),
            DecodingKey::from_base64_secret(&app_secret).unwrap(),
        ))
        .map_err(|_| EnvError::AppSecret)
}

pub fn db_connection_string() -> Result<String, EnvError> {
    env::var(VAR_DB_CONNECTION_STRING).map_err(|_| EnvError::DbConnectionString)
}

pub fn listen_addr_port() -> Result<SocketAddr, EnvError> {
    env::var(VAR_LISTEN_ADDRESS_PORT)
        .as_ref()
        .map(String::as_str)
        .unwrap_or("0.0.0.0:6969")
        .parse()
        .map_err(|_| EnvError::ListenAddressPort)
}