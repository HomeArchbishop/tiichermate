use warp::Filter;
use std::collections::HashMap;
use serde_json::json;
use crate::controller;

pub fn active_signs() -> impl Filter<Extract = (String,), Error = warp::Rejection> + Clone {
  warp::path!("api" / "active_signs")
    .and(warp::get())
    .and(warp::query::<HashMap<String, String>>())
    .and_then(|query: HashMap<String, String>| async move {
      if let Some(open_id) = query.get("openId") {
        let response = controller::api::get_active_signs(open_id)
          .await
          .unwrap_or_else(|err| json!({
            "message": err.to_string()
          }).to_string());
        Ok::<_, warp::Rejection>(response)
      } else {
        Ok::<_, warp::Rejection>(json!({
          "message": "Missing openId query parameter".to_string()
        }).to_string())
      }
    })
}

pub fn sign_in() -> impl Filter<Extract = (String,), Error = warp::Rejection> + Clone {
  warp::path!("api" / "sign_in")
    .and(warp::get())
    .and(warp::query::<HashMap<String, String>>())
    .and_then(|query: HashMap<String, String>| async move {
      if let Some(open_id) = query.get("openId") {
        let course_id = query.get("courseId").unwrap_or(&"0".to_string()).parse::<u32>().unwrap_or(0);
        let sign_id = query.get("signId").unwrap_or(&"0".to_string()).parse::<u32>().unwrap_or(0);
        let lon = query.get("lon").and_then(|s| s.parse::<f64>().ok());
        let lat = query.get("lat").and_then(|s| s.parse::<f64>().ok());

        println!("course_id: {}, sign_id: {}, lon: {:?}, lat: {:?}", course_id, sign_id, lon, lat);

        if course_id == 0 || sign_id == 0 {
          return Ok::<_, warp::Rejection>(json!({
            "message": "Invalid courseId or signId".to_string()
          }).to_string())
        }

        let response = controller::api::sign_in(open_id, controller::api::SignInQuery {
          course_id,
          sign_id,
          lon,
          lat,
        })
        .await
        .unwrap_or_else(|err| json!({
          "message": err.to_string()
        }).to_string());
        Ok::<_, warp::Rejection>(response)
      } else {
        Ok::<_, warp::Rejection>(json!({
          "message": "Missing openId query parameter".to_string()
        }).to_string())
      }
    })
}
