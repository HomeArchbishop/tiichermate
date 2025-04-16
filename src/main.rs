mod api_server;

mod controller;
mod routes;

#[tokio::main]
async fn main() {
  api_server::start().await;
}
