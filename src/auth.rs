use std::collections::HashMap;

/// 鉴权配置
#[derive(Clone)]
pub struct AuthConfig {
    pub api_key: Option<String>,
    pub allowed_tokens: Vec<String>,
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            api_key: None,
            allowed_tokens: vec![],
        }
    }
}

/// 鉴权错误类型
#[derive(Debug)]
pub enum AuthError {
    MissingAuth,
    InvalidApiKey,
}

impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AuthError::MissingAuth => write!(f, "Missing authentication"),
            AuthError::InvalidApiKey => write!(f, "Invalid API key"),
        }
    }
}

impl std::error::Error for AuthError {}

/// 从环境变量或默认值获取鉴权配置
pub fn get_auth_config() -> AuthConfig {
    AuthConfig {
        api_key: std::env::var("TIICHERMATE_API_KEY").ok(),
        allowed_tokens: std::env::var("TIICHERMATE_TOKENS")
            .ok()
            .map(|tokens| tokens.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default(),
    }
}

pub fn check_auth_config() -> bool {
    let config = get_auth_config();
    config.api_key.is_some() && !config.allowed_tokens.is_empty()
}

/// 检查请求是否通过鉴权
pub fn check_auth(
    api_key: Option<String>,
    auth_header: Option<String>,
    query: &HashMap<String, String>,
) -> Result<(), AuthError> {
    let config = get_auth_config();
    
    // 检查 API Key
    if let Some(expected_key) = &config.api_key {
        if let Some(key) = api_key {
            if key != *expected_key {
                return Err(AuthError::InvalidApiKey);
            }
        }
    }
    
    // 检查 Bearer Token
    let mut is_valid = false;
    if !config.allowed_tokens.is_empty() {
        if let Some(header) = auth_header {
            if header.starts_with("Bearer ") {
                let token = &header[7..];
                if config.allowed_tokens.contains(&token.to_string()) {
                    is_valid = true;
                }
            }
        }
        
        // 检查查询参数中的 token
        if let Some(token) = query.get("token") {
            if config.allowed_tokens.contains(token) {
                is_valid = true;
            }
        }

        if !is_valid {
            return Err(AuthError::MissingAuth);
        }
    }
    
    // 如果没有任何鉴权配置，则允许通过
    // NOTE: 如果需要强制配置鉴权，请在服务启动时强制检查配置并拦截启动
    Ok(())
}
