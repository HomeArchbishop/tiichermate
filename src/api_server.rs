use warp::Filter;
use crate::routes;

pub async fn start() {
  let cors = warp::cors()
    .allow_any_origin()
    .allow_methods(vec!["GET", "POST", "DELETE"]);

  let api_routes =
    routes::api::active_signs()
    .or(routes::api::sign_in())
    .with(cors);

  let routes = api_routes;

  warp::serve(routes)
    .run(([127, 0, 0, 1], 1357))
    .await;
}
