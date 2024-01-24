use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(sqlx::FromRow, Serialize)]
pub struct UserApiResponse {
    pub user_id: Uuid,
    pub username: String,
    pub display_name: String,
}

#[derive(Serialize)]
pub struct UserTokenResponse {
    pub token: String,
}

#[derive(Deserialize)]
pub struct UserCredentialsRequest {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct UserRegisterRequest {
    pub username: String,
    pub password: String,
    pub display_name: String,
}

#[derive(Deserialize)]
pub struct DayRegisterRequest {
    pub date: NaiveDate,
    pub level: i32,
    pub comment: Option<String>,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct LeaderboardRow {
    pub user_id: Uuid,
    pub display_name: String,
    pub drink_days: i64,
    pub total_days: i64,
    pub total_score: i64,
}

#[derive(Serialize)]
pub struct UserDataResponse {
    pub user_id: Uuid,
    pub display_name: String,
    pub days: Vec<UserDataDaysResponse>,
}

#[derive(Serialize)]
pub struct UserDataDaysResponse {
    pub date: NaiveDate,
    pub level: i32,
    pub comment: Option<String>,
}
