use serde::Serialize;

/// 业务错误码定义
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCode {
    /// 成功
    Success = 0,
    /// 参数错误
    InvalidParams = 40000,
    /// 用户未鉴权
    Unauthorized = 40001,
    /// 系统内部错误
    InternalError = 50000,
    /// 外部API错误
    ExternalApiError = 50001,
}

impl ErrorCode {
    /// 根据错误码获取对应的错误消息
    pub fn get_message(&self) -> &'static str {
        match self {
            ErrorCode::Success => "Success",
            ErrorCode::InvalidParams => "Invalid Params",
            ErrorCode::Unauthorized => "Unauthorized",
            ErrorCode::InternalError => "Internal Error",
            ErrorCode::ExternalApiError => "External API Error",
        }
    }
}

/// 统一API响应格式
#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub code: i32,
    pub msg: String,
    pub result: Option<T>,
}

/// 外部API响应格式
#[derive(Serialize)]
pub struct ExternalApiErrorResult {
    pub status: u16,
    pub error_code: i32,
    pub msg: String,
    pub msg_client: String,
}

impl<T> ApiResponse<T> {
    /// 成功响应
    pub fn success(result: T) -> Self {
        Self {
            code: ErrorCode::Success as i32,
            msg: ErrorCode::Success.get_message().to_string(),
            result: Some(result),
        }
    }

    /// 根据错误码创建错误响应
    pub fn error(error_code: ErrorCode, result: Option<T>) -> Self {
        Self {
            code: error_code as i32,
            msg: error_code.get_message().to_string(),
            result: result,
        }
    }

    /// 参数错误
    pub fn invalid_params() -> Self {
        Self::error(ErrorCode::InvalidParams, None)
    }

    /// 用户未登录
    pub fn unauthorized() -> Self {
        Self::error(ErrorCode::Unauthorized, None)
    }

    /// 系统内部错误
    pub fn internal_error(result: Option<T>) -> Self {
        Self::error(ErrorCode::InternalError, result)
    }

    /// 外部API错误
    pub fn external_api_error(result: Option<ExternalApiErrorResult>) -> Self
    where
        T: From<ExternalApiErrorResult>,
    {
        let converted_result = result.map(T::from);
        Self::error(ErrorCode::ExternalApiError, converted_result)
    }
}
