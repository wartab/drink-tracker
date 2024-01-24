use chrono::NaiveDate;
use serde::Serialize;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
pub struct User {
    pub user_id: Uuid,
    pub username: String,
    pub password: String,
    pub display_name: String,
}

#[derive(sqlx::FromRow, Serialize)]
pub struct RegisteredDay {
    pub registered_day_id: Uuid,
    pub user_id: Uuid,
    pub date: NaiveDate,
    pub level: i32,
    pub comment: Option<String>,
}

#[derive(sqlx::FromRow)]
pub struct SimplifiedUser {
    pub display_name: String,
}