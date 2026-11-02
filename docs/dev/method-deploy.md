# 自部署方案

## Step1 部署后端

```bash
# build
zig build -Doptimize=ReleaseSafe
# run
./zig-out/bin/tiichermate
# or
zig build run -Doptimize=ReleaseSafe
```

会在 `1357` 端口启动 HTTP 服务。如需要 HTTPS，请使用 nginx 或其他反向代理工具。**特别注意，如果前端是 HTTPS， 后端必须使用 HTTPS**

## Step2 部署前端

前端在 `fe` 目录下，直接使用静态服务器即可。

## Step3 在手机/电脑上配置 MITM

> [wikipedia: MITM](https://zh.wikipedia.org/wiki/%E4%B8%AD%E9%97%B4%E4%BA%BA%E6%94%BB%E5%87%BB)

这一步的目标是，将 `https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=(\w+)` 重定向至 `your-frontend-domain?api={your-backend-domain}&openid={weixin-openid}`，其中 openid 是从原 URL 中提取的。

- iOS

  - Shadowrocket 配置模板（需自己改）

    ```yaml
    [MITM]
    hostname = v18.teachermate.cn
    [URL Rewrite]
    ^https://v18\.teachermate\.cn/wechat-pro-ssr/student/sign\?openid=(\w+)$ https://{your-frontend-domain}?api={https://your-backend-domain}&openid=$1
    ```

  - ProxyPin

- Android

  - ProxyPin

- PC

  - [mitmproxy](https://mitmproxy.org/) 是一个强大的工具，可以用来进行 HTTPS 流量的中间人攻击。正确启动后修改系统代理到相应 MITM 服务器端口

  - 自己写

## 日常使用

至此，你已经完成了全部步骤。在即将签到时，在微信中点击 `【微助教服务号】> 【学生】> 【签到】` 你看到的应该是重定向后的页面，挂机等签到就好。一旦收到签到信息：

- GPS 签到/普通签到：会自动处理。

- 二维码签到，需要手动点击链接。
