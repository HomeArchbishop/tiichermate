# Tiichermate

我的目标是吃着海底捞也能一键签上微助教。

> 本项目的主要服务对象是手机，通过设置 MITM 获得简单的挂机签到功能。如果你只想PC+手机扫码使用，下面的项目可能更简单。
>
> https://github.com/ManiaciaChao/yatm

> 小白使用教程：[借助 ProxyPin 的使用教程](docs/tutorial/proxypin.md)

本仓库支持两种使用方案：

- [Direct MITM 方案](docs/dev/method-mitm.md)：独立使用 MITM 脚本不依赖前后端。使用方便但灵活性差。
- [自部署方案](docs/dev/method-deploy.md)：自行部署后端与前端，再通过 MITM 把签到页重定向到自建前端。因为前后端分离，此方法适合需要灵活使用的进阶场景。例如只使用后端服务，通过二次开发可以接入 Bot。

## License

Licensed under [MIT](./LICENSE).
