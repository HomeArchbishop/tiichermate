use serde::Serialize;

/// 签到请求数据模型
#[derive(Serialize)]
pub struct SignInRequest {
    #[serde(rename = "courseId")]
    pub course_id: u32,
    #[serde(rename = "signId")]
    pub sign_id: u32,
    pub lon: Option<f64>,
    pub lat: Option<f64>,
}

/// 获得二维码请求数据模型
#[derive(Serialize)]
pub struct GetQrCodeRequest {
    #[serde(rename = "courseId")]
    pub course_id: u32,
    #[serde(rename = "signId")]
    pub sign_id: u32,
}
