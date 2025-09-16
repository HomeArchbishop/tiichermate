mod api_server;
mod ui;
mod auth;

mod controller;
mod service;
mod models;

#[tokio::main]
async fn main() {
  ui::Ui::show_banner();

  ui::Ui::show_auth_config();

  if !auth::check_auth_config() {
    return;
  }

  api_server::start().await;
}
