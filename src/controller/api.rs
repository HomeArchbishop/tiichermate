use std::collections::HashMap;
use once_cell::sync::Lazy;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT, CONTENT_TYPE, ACCEPT, ACCEPT_LANGUAGE, IF_NONE_MATCH, REFERER};
use serde_json::json;
use serde::Serialize;

static BASE_URLS: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    let mut map = HashMap::new();
    map.insert("active_signs", "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs");
    map.insert("sign_in", "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in");
    map.insert("faye", "https://www.teachermate.com.cn/faye");
    map
});

fn build_headers(open_id: &str, referrer: &str) -> HeaderMap {
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
  
  let referer_value = format!("{}{}", referrer, open_id);
  headers.insert(REFERER, HeaderValue::from_str(&referer_value).unwrap());

  headers
}

pub async fn get_active_signs(open_id: &str) -> Result<String, reqwest::Error> {
  let client = reqwest::Client::new();
  let url = *BASE_URLS.get("active_signs").unwrap();
  let referrer = "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=";
  let headers = build_headers(open_id, referrer);
  match client.get(url).headers(headers).send().await {
    Ok(resp) => {
      let status = resp.status();
      let text = resp.text().await.unwrap_or(json!({
        "message": "BE_Error in resp.text()".to_string()
      }).to_string());
      println!("Response: {} [status] {}", text, status);
      Ok(text)
    },
    Err(err) => {
      println!("Error: {}", err.to_string());
      Err(err)
    }
  }
}

#[derive(Serialize)]
pub struct SignInQuery {
  #[serde(rename = "courseId")]
  pub(crate) course_id: u32,
  #[serde(rename = "signId")]
  pub(crate) sign_id: u32,
  pub(crate) lon: Option<f64>,
  pub(crate) lat: Option<f64>,
}

pub async fn sign_in(open_id: &str, query: SignInQuery) -> Result<String, reqwest::Error> {
  let client = reqwest::Client::new();
  let url = *BASE_URLS.get("sign_in").unwrap();
  let referrer = "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=";
  let headers = build_headers(open_id, referrer);
  match client.post(url).headers(headers).json(&query).send().await {
    Ok(resp) => {
      let status = resp.status();
      let text = resp.text().await.unwrap_or(json!({
        "message": "BE_Error in resp.text()".to_string()
      }).to_string());
      println!("Response: {} [status] {}", text, status);
      Ok(text)
    },
    Err(err) => {
      println!("Error: {}", err.to_string());
      Err(err)
    }
  }
}
