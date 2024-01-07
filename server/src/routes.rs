use std::time::{Duration, SystemTime};

use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::rand_core::OsRng;
use argon2::password_hash::SaltString;
use axum::{Extension, Json, middleware, Router};
use axum::extract::{Path, State};
use axum::http::header::AUTHORIZATION;
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::Response;
use axum::routing::{get, post};
use chrono::Datelike;
use jsonwebtoken::Header;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{AppSecret, AppState};
use crate::error::{AppError, MapToAppError};
use crate::models::api::{DayRegisterRequest, LeaderboardRow, UserApiResponse, UserCredentialsRequest, UserRegisterRequest, UserTokenResponse};
use crate::models::auth::UserClaims;
use crate::models::db::{RegisteredDay, User};

fn get_password_hash(password: &str) -> String {
    let argon2 = Argon2::default();
    let salt = SaltString::generate(&mut OsRng);
    argon2.hash_password(password.as_bytes(), &salt).unwrap().to_string()
}

pub async fn auth_by_token(token: &str, app_secret: &AppSecret) -> Option<UserClaims> {

    let token_data = jsonwebtoken::decode::<UserClaims>(
        token,
        &app_secret.0.decoding_key,
        &jsonwebtoken::Validation::default(),
    ).ok()?;

    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .ok()?;

    if now >= Duration::from_secs(token_data.claims.exp) {
        return None;
    }

    Some(token_data.claims)
}

async fn require_active_user<B>(
    State(app_secret): State<AppSecret>,
    mut request: axum::http::Request<B>,
    next: Next<B>
) -> Result<Response, AppError> {
    let token = request.headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::new("Invalid token", StatusCode::UNAUTHORIZED))?;

    let user = auth_by_token(token, &app_secret).await;

    if let Some(user) = user {
        request.extensions_mut().insert(user);
        Ok(next.run(request).await)
    } else {
        Err(AppError::new("Invalid token", StatusCode::UNAUTHORIZED))
    }
}

async fn get_account(
    Extension(user): Extension<UserClaims>,
    State(db): State<PgPool>,
) -> Json<UserApiResponse> {
    let user = sqlx::query_as::<_, UserApiResponse>(
        r#"select * from users where user_id = $1"#
    )
        .bind(user.user_id)
        .fetch_one(&db)
        .await
        .unwrap();

    Json(user)
}

async fn register_user(
    State(db): State<PgPool>,
    Json(credentials): Json<UserRegisterRequest>,
) -> Result<Json<UserApiResponse>, AppError> {
    let username = credentials.username.trim();
    let display_name = credentials.display_name.trim();
    let password = credentials.password;

    if username.is_empty() || display_name.is_empty() || password.is_empty() {
        return Err(AppError::new("Invalid data", StatusCode::FORBIDDEN));
    }

    let existing_user = sqlx::query_as::<_, User>(
        r#"select * from users where lower(username) = lower($1)"#
    )
        .bind(username)
        .fetch_optional(&db)
        .await
        .map_to_internal_error()?;

    if existing_user.is_some() {
        return Err(AppError::new("User already exists", StatusCode::FORBIDDEN));
    }

    let hashed_password = get_password_hash(&password);

    let user = sqlx::query_as::<_, User>(
        r#"insert into users (username, display_name, password) values ($1, $2, $3) returning *"#
    )
        .bind(&username)
        .bind(&display_name)
        .bind(&hashed_password)
        .fetch_one(&db)
        .await
        .map_to_internal_error()?;

    Ok(Json(UserApiResponse {
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name,
    }))

}

async fn login(
    State(db): State<PgPool>,
    State(app_secret): State<AppSecret>,
    Json(credentials): Json<UserCredentialsRequest>,
) -> Result<Json<UserTokenResponse>, AppError> {
    let username = credentials.username.trim();
    let password = credentials.password;

    if username.is_empty() || password.is_empty() {
        return Err(AppError::new("Invalid credentials", StatusCode::FORBIDDEN));
    }

    let user = sqlx::query_as::<_, User>(
        r#"select * from users where lower(username) = lower($1)"#
    )
        .bind(username)
        .fetch_optional(&db)
        .await
        .map_to_internal_error()?;

    if let Some(user) = user {
        let argon2 = Argon2::default();
        let password_hash = PasswordHash::new(&user.password).map_to_internal_error()?;

        match argon2.verify_password(password.as_bytes(), &password_hash) {
            Ok(_) => {
                let now = SystemTime::now()
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .map_to_internal_error()?;
                let in_twelve_hours = now + Duration::from_secs(60 * 60 * 12);

                let claims = UserClaims {
                    user_id: user.user_id,
                    username: user.username,
                    exp: in_twelve_hours.as_secs(),
                };

                let token = jsonwebtoken::encode(
                    &Header::default(),
                    &claims,
                    &app_secret.0.encoding_key,
                ).map_to_internal_error()?;

                Ok(Json(UserTokenResponse {
                    token,
                }))
            },
            Err(_) => Err(AppError::new("Invalid credentials", StatusCode::FORBIDDEN)),
        }
    } else {
        Err(AppError::new("Invalid credentials", StatusCode::FORBIDDEN))
    }
}

async fn register_day(
    Extension(user): Extension<UserClaims>,
    State(db): State<PgPool>,
    Json(model): Json<DayRegisterRequest>,
) -> Result<Json<bool>, AppError> {
    let date = model.date;

    let current_year = chrono::Local::now().year();

    if date.year() > current_year {
        return Err(AppError::new("Invalid data", StatusCode::FORBIDDEN));
    }

    sqlx::query(r#"
    insert into registered_days (user_id, date, level, comment) values ($1, $2, $3, $4)
    on conflict (user_id, date) do update set level = $3, comment = $4
    "#)
        .bind(user.user_id)
        .bind(date)
        .bind(model.level)
        .bind(model.comment)
        .execute(&db)
        .await
        .map_to_internal_error()?;

    Ok(Json(true))
}

async fn get_user_days(
    State(db): State<PgPool>,
    Path((user_id, year)): Path<(Uuid, i32)>,
) -> Result<Json<Vec<RegisteredDay>>, AppError> {
    let days = sqlx::query_as::<_, RegisteredDay>(r#"
    select * from registered_days where user_id = $1 and date_part('year', date) = $2
    order by date
    "#)
        .bind(user_id)
        .bind(year)
        .fetch_all(&db)
        .await
        .map_to_internal_error()?;

    Ok(Json(days))
}

async fn get_leaderboard(
    State(db): State<PgPool>,
    Path(year): Path<i32>,
) -> Result<Json<Vec<LeaderboardRow>>, AppError> {
    let days = sqlx::query_as::<_, LeaderboardRow>(r#"
    select
        users.user_id,
        users.display_name,
        sum(case when registered_days.level >= 1 then 1 else 0 end) as drink_days,
        count(registered_days.registered_day_id) as total_days
    from
        registered_days
        inner join
            users on users.user_id = registered_days.user_id
    where date_part('year', registered_days.date) = $1
    group by users.user_id, users.display_name
    order by drink_days desc, users.display_name asc
    "#)
        .bind(year)
        .fetch_all(&db)
        .await
        .map_to_internal_error()?;

    Ok(Json(days))
}

pub fn all_routes(app_state: AppState) -> Router {
    Router::new()
        .route("/account", get(get_account))
        .route("/user-days/:user_id/:year", get(get_user_days))
        .route("/leaderboard/:year", get(get_leaderboard))
        .route("/register-day", post(register_day))
        .route_layer(middleware::from_fn_with_state(app_state.clone(), require_active_user))
        .route("/login", post(login))
        .route("/register", post(register_user))
        .with_state(app_state)
}