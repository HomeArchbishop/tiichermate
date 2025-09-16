use warp::Filter;
use crate::controller;
use crate::ui;

pub async fn start() {
  let cors = warp::cors()
    .allow_any_origin()
    .allow_methods(vec!["GET", "POST", "DELETE"])
    .allow_headers(vec!["content-type", "x-api-key", "authorization"]);

  // 组合所有路由（鉴权已在控制器中处理）
  let routes = 
    controller::tiichermate::active_signs()  // 需要鉴权
    .or(controller::tiichermate::sign_in())  // 需要鉴权
    .or(controller::tiichermate::health_check()) // 无需鉴权
    .with(cors);

  ui::Ui::show_server_ready("127.0.0.1", "1357");

  warp::serve(routes)
    .run(([127, 0, 0, 1], 1357))
    .await;
}
