mod env;
mod error;
mod routes;
mod models;

use std::process::ExitCode;
use std::sync::Arc;
use axum::extract::FromRef;
use axum::Server;
use jsonwebtoken::{DecodingKey, EncodingKey};
use sqlx::{Pool, Postgres};
use sqlx::postgres::PgPoolOptions;
use tokio::signal;
use tower_http::cors::CorsLayer;

#[derive(Clone)]
pub struct AppSecretPair {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

#[derive(Clone)]
pub struct AppSecret(Arc<AppSecretPair>);

#[derive(Clone, FromRef)]
pub struct AppState {
    app_secret: AppSecret,
    db: Pool<Postgres>,
}

async fn start_server() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let db_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(env::db_connection_string()?.as_str())
        .await?;

    let app_secret = env::app_secret()?;

    let app_state = AppState {
        db: db_pool,
        app_secret: AppSecret(Arc::new(AppSecretPair {
            encoding_key: app_secret.0,
            decoding_key: app_secret.1,
        })),
    };

    let router = routes::all_routes(app_state)
        .layer(CorsLayer::permissive());

    let addr = env::listen_addr_port()?;

    Server::bind(&addr)
        .serve(router.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

#[tokio::main]
async fn main() -> ExitCode {
    match start_server().await {
        Ok(_) => ExitCode::SUCCESS,

        Err(e) => {
            eprintln!("Error: {}", e);
            ExitCode::FAILURE
        }
    }
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
        let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
        let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    println!("signal received, starting graceful shutdown");
}
