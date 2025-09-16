use std::collections::HashMap;
use once_cell::sync::Lazy;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT, CONTENT_TYPE, ACCEPT, ACCEPT_LANGUAGE, IF_NONE_MATCH, REFERER};
use crate::models::tiichermate::SignInRequest;

/// 构建外部API错误信息
fn build_external_api_error(status: u16, text: &str) -> String {
    format!("External API error: status[{}], text[{}]", status, text)
}

static BASE_URLS: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    let mut map = HashMap::new();
    map.insert("active_signs", "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs");
    map.insert("sign_in", "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in");
    map.insert("faye", "https://www.teachermate.com.cn/faye");
    map
});

fn build_headers(open_id: &str) -> HeaderMap {
    let mut headers = HeaderMap::new();

    let user_agent = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 \
    (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36 QBCore/4.0.1326.400 \
    QQBrowser/9.0.2524.400 Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 \
    (KHTML, like Gecko) Chrome/53.0.2875.116 Safari/537.36 NetType/WIFI \
    MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63010200)";

    headers.insert(USER_AGENT, HeaderValue::from_str(user_agent).unwrap());
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(ACCEPT, HeaderValue::from_static("*/*"));
    headers.insert(ACCEPT_LANGUAGE, HeaderValue::from_static("zh-CN,en-US;q=0.7,en;q=0.3"));
    headers.insert(IF_NONE_MATCH, HeaderValue::from_static("\"38-djBNGTNDrEJXNs9DekumVQ\""));
    headers.insert("openId", HeaderValue::from_str(open_id).unwrap());

    let referrer = "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=";
    let referer_value = format!("{}{}", referrer, open_id);
    headers.insert(REFERER, HeaderValue::from_str(&referer_value).unwrap());

    headers
}

/// 获取签到列表
pub async fn get_active_signs(open_id: &str) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = *BASE_URLS.get("active_signs").unwrap();
    let headers = build_headers(open_id);
    
    match client.get(url).headers(headers).send().await {
        Ok(resp) => {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_else(|_| "{}".to_string());
            println!("Response: {} [status] {}", text, status);
            
            if status.is_success() {
                // 尝试解析JSON，如果失败则作为字符串处理
                match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(data) => Ok(data),
                    Err(_) => Err(text),
                }
            } else {
                Err(build_external_api_error(status.as_u16(), &text))
            }
        },
        Err(err) => {
            // 请求发送失败
            println!("Error: {}", err.to_string());
            Err(err.to_string())
        }
    }
}

/// 执行普通/GPS签到操作
pub async fn sign_in(open_id: &str, request: SignInRequest) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = *BASE_URLS.get("sign_in").unwrap();
    let headers = build_headers(open_id);
    
    match client.post(url).headers(headers).json(&request).send().await {
        Ok(resp) => {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_else(|_| "{}".to_string());
            println!("Response: {} [status] {}", text, status);
            
            if status.is_success() {
                // 尝试解析JSON，如果失败则作为字符串处理
                match serde_json::from_str::<serde_json::Value>(&text) {
                    Ok(data) => {
                        if data["errorCode"].is_u64() {
                            return Err(build_external_api_error(status.as_u16(), &text));
                        }
                        Ok(data)
                    },
                    Err(_) => Err(text),
                }
            } else {
                Err(build_external_api_error(status.as_u16(), &text))
            }
        },
        Err(err) => {
            println!("Error: {}", err.to_string());
            Err(err.to_string())
        }
    }
}
