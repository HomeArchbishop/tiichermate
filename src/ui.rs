use crate::auth;

/// UI 模块 - 负责所有控制台输出和用户界面提示
pub struct Ui;

impl Ui {
    /// 显示应用启动横幅
    pub fn show_banner() {
        println!("TIICHERMATE_BE");
        println!("version: {}", env!("CARGO_PKG_VERSION"));
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    pub fn show_auth_config() {
        // 显示鉴权配置信息
        let auth_config = auth::get_auth_config();
        if auth_config.api_key.is_some() || !auth_config.allowed_tokens.is_empty() {
            println!("Authentication enabled:");
            if let Some(_) = auth_config.api_key {
                println!("   - API Key authentication");
            }
            if !auth_config.allowed_tokens.is_empty() {
                println!("   - Token authentication ({} tokens configured)", auth_config.allowed_tokens.len());
            }
        } else {
            println!("\x1b[31mNo authentication configured\x1b[0m");
            println!("\x1b[31mServer exits...\x1b[0m");
        }
    }

    /// 显示服务器配置完成信息
    pub fn show_server_ready(server_address_host: &str, server_address_port: &str) {
        println!("server is ready");
        println!("server address: {}:{}", server_address_host, server_address_port);        
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
}
