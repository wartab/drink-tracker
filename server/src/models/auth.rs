use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct UserClaims {
    pub user_id: Uuid,
    pub username: String,
    pub exp: u64,
}