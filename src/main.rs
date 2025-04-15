use warp::Filter;

mod controller;
mod routes;

#[tokio::main]
async fn main() {
  let cors = warp::cors()
    .allow_any_origin()
    .allow_methods(vec!["GET", "POST", "DELETE"]);

  let api_routes =
    routes::api::active_signs()
    .or(routes::api::sign_in())
    .with(cors);

  let routes = api_routes;

  warp::serve(routes)
    .run(([127, 0, 0, 1], 3030))
    .await;
}