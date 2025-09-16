use warp::Filter;
use std::collections::HashMap;
use crate::service::tiichermate;
use crate::models::tiichermate::SignInRequest;
use crate::models::response::ApiResponse;
use crate::auth;

/// 创建需要鉴权的端点过滤器
fn create_authenticated_endpoint<F, Fut>(
    handler: F,
) -> impl Filter<Extract = (warp::reply::WithStatus<warp::reply::Json>,), Error = warp::Rejection> + Clone
where
    F: Fn(HashMap<String, String>) -> Fut + Clone + Send + Sync + 'static,
    Fut: std::future::Future<Output = Result<warp::reply::WithStatus<warp::reply::Json>, warp::Rejection>> + Send,
{
    warp::header::optional::<String>("x-api-key")
        .and(warp::header::optional::<String>("authorization"))
        .and(warp::query::<HashMap<String, String>>())
        .and_then(move |api_key: Option<String>, auth_header: Option<String>, query: HashMap<String, String>| {
            let handler = handler.clone();
            async move {
                // 检查鉴权
                if let Err(auth_error) = auth::check_auth(api_key, auth_header, &query) {
                    let response = match auth_error {
                        auth::AuthError::MissingAuth => {
                            let api_response = ApiResponse::<()>::unauthorized();
                            warp::reply::with_status(
                                warp::reply::json(&api_response),
                                warp::http::StatusCode::UNAUTHORIZED
                            )
                        },
                        auth::AuthError::InvalidApiKey => {
                            let api_response = ApiResponse::<()>::unauthorized();
                            warp::reply::with_status(
                                warp::reply::json(&api_response),
                                warp::http::StatusCode::UNAUTHORIZED
                            )
                        }
                    };
                    return Ok::<_, warp::Rejection>(response);
                }

                // 执行业务逻辑
                handler(query).await
            }
        })
}

/// 获取活跃签到列表的控制器
pub fn active_signs() -> impl Filter<Extract = (warp::reply::WithStatus<warp::reply::Json>,), Error = warp::Rejection> + Clone {
    warp::path!("api" / "active_signs")
        .and(warp::get())
        .and(create_authenticated_endpoint(|query: HashMap<String, String>| async move {
            if let Some(open_id) = query.get("openId") {
                match tiichermate::get_active_signs(open_id).await {
                    Ok(result) => {
                        let api_response = ApiResponse::success(result);
                        Ok(warp::reply::with_status(
                            warp::reply::json(&api_response),
                            warp::http::StatusCode::OK
                        ))
                    },
                    Err(_err) => {
                        let api_response = ApiResponse::internal_error(Some(_err));
                        Ok(warp::reply::with_status(
                            warp::reply::json(&api_response),
                            warp::http::StatusCode::INTERNAL_SERVER_ERROR
                        ))
                    }
                }
            } else {
                let api_response = ApiResponse::<()>::invalid_params();
                Ok(warp::reply::with_status(
                    warp::reply::json(&api_response),
                    warp::http::StatusCode::BAD_REQUEST
                ))
            }
        }))
}

/// 执行签到的控制器
pub fn sign_in() -> impl Filter<Extract = (warp::reply::WithStatus<warp::reply::Json>,), Error = warp::Rejection> + Clone {
    warp::path!("api" / "sign_in")
        .and(warp::get())
        .and(create_authenticated_endpoint(|query: HashMap<String, String>| async move {
            if let Some(open_id) = query.get("openId") {
                let course_id = query.get("courseId").unwrap_or(&"0".to_string()).parse::<u32>().unwrap_or(0);
                let sign_id = query.get("signId").unwrap_or(&"0".to_string()).parse::<u32>().unwrap_or(0);
                let lon = query.get("lon").and_then(|s| s.parse::<f64>().ok());
                let lat = query.get("lat").and_then(|s| s.parse::<f64>().ok());

                println!("course_id: {}, sign_id: {}, lon: {:?}, lat: {:?}", course_id, sign_id, lon, lat);

                if course_id == 0 || sign_id == 0 {
                    let api_response = ApiResponse::<()>::invalid_params();
                    return Ok(warp::reply::with_status(
                        warp::reply::json(&api_response),
                        warp::http::StatusCode::BAD_REQUEST
                    ));
                }

                let sign_in_request = SignInRequest {
                    course_id,
                    sign_id,
                    lon,
                    lat,
                };

                match tiichermate::sign_in(open_id, sign_in_request).await {
                    Ok(result) => {
                        let api_response = ApiResponse::success(result);
                        Ok(warp::reply::with_status(
                            warp::reply::json(&api_response),
                            warp::http::StatusCode::OK
                        ))
                    },
                    Err(_err) => {
                        let api_response = ApiResponse::internal_error(Some(_err));
                        Ok(warp::reply::with_status(
                            warp::reply::json(&api_response),
                            warp::http::StatusCode::INTERNAL_SERVER_ERROR
                        ))
                    }
                }
            } else {
                let api_response = ApiResponse::<()>::invalid_params();
                Ok(warp::reply::with_status(
                    warp::reply::json(&api_response),
                    warp::http::StatusCode::BAD_REQUEST
                ))
            }
        }))
}

/// 健康检查端点
pub fn health_check() -> impl Filter<Extract = (warp::reply::WithStatus<warp::reply::Json>,), Error = warp::Rejection> + Clone {
    warp::path!("api" / "health")
        .and(warp::get())
        .map(|| {
            let api_response = ApiResponse::success("OK".to_string());
            warp::reply::with_status(
                warp::reply::json(&api_response),
                warp::http::StatusCode::OK
            )
        })
}
