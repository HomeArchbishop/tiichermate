# 鉴权配置说明

选择性鉴权，即某些接口需要鉴权，某些接口可以无需鉴权。

## 鉴权方式

### 1. API Key 鉴权

通过 HTTP 头部 `x-api-key` 传递 API Key。

**配置方法：**
```bash
export TIICHERMATE_API_KEY="your-secret-api-key"
```

### 2. Bearer Token 鉴权

通过 HTTP 头部 `authorization` 传递 Bearer Token。

**配置方法：**
```bash
export TIICHERMATE_TOKENS="token1,token2,token3"
```

### 3. 查询参数 Token 鉴权

通过 URL 查询参数 `token` 传递 Token。

**配置方法：**
```bash
export TIICHERMATE_TOKENS="token1,token2,token3"
```

**使用示例：**
```bash
curl "http://127.0.0.1:1357/api/active_signs?openId=test&token=token1"
```

## 接口鉴权策略

### 需要鉴权的接口
- `/api/active_signs` - 获取活跃签到列表
- `/api/sign_in` - 执行签到

### 无需鉴权的接口
- `/health` - 健康检查端点

## 鉴权优先级

1. 如果配置了 `TIICHERMATE_API_KEY`，则必须提供正确的 API Key
2. 如果配置了 `TIICHERMATE_TOKENS`，则必须提供有效的 Token（通过 Bearer 头部或查询参数）
3. 如果都没有配置，则 API 开放访问（不推荐生产环境）

## 错误响应

当鉴权失败时，API 会返回以下格式的错误响应：

```json
{
  "error": "Authentication failed",
  "message": "Missing authentication"
}
```

常见的错误消息：
- `Missing authentication`: 缺少鉴权信息
- `Invalid API key`: API Key 无效
- `Invalid token`: Token 无效
