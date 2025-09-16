# Tiichermate API 文档

### 统一响应格式

```typescript
interface ApiResponse<T> {
  code: number
  msg: string
  result: T | null
}
```

## 鉴权

### 鉴权方式

通过 HTTP 头部 `x-api-key` 传递 API Key。

通过 HTTP 头部 `authorization` 传递 Bearer Token。

通过 URL 查询参数 `token` 传递 Token。

详细鉴权配置说明请参考：[鉴权配置说明](auth.md)

## API 接口

### 1. 获取活跃签到列表

获取指定用户的活跃签到课程列表。

**请求信息:**
- **URL**: `/api/active_signs`
- **method**: `GET`
- **auth**: required

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `openId` | string | y | 用户唯一标识 |

**请求示例:**
```bash
curl -X GET "http://127.0.0.1:8080/api/active_signs?openId=your_open_id" \
  -H "x-api-key: your_api_key"
```

**响应示例:**

成功响应:
```json
{
  "code": 0,
  "msg": "Success",
  "result": [
    {
      "code":"OA138",
      "courseId":1399526,
      "cover":"https://app.teachermate.com.cn/covers/athletics6.png",
      "isGPS":0,
      "isQR":1,
      "name":"测试课堂x",
      "signId":3681230,
      "startYear":2024,
      "term":"秋"
    }
  ]
}
```

### 2. 执行签到

执行签到操作。

**请求信息:**
- **URL**: `/api/sign_in`
- **method**: `GET`
- **auth**: required

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| openId | string | y | 用户唯一标识 |
| courseId | integer | y | 课程ID |
| signId | integer | y | 签到ID |
| lon | float | n | 经度 (GPS签到需要) |
| lat | float | n | 纬度 (GPS签到需要) |

**请求示例:**
```bash
curl -X GET "http://127.0.0.1:8080/api/sign_in?openId=your_open_id&courseId=1383396&signId=3681320&lon=116.3974&lat=39.9093" \
  -H "x-api-key: your_api_key"
```

**响应示例:**

成功响应:
```json
{
  "code": 0,
  "msg": "Success",
  "result": {
    "success": true,
    "message": "签到成功",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

参数错误响应:
```json
{
  "code": 40000,
  "msg": "Invalid Params",
  "result": null
}
```

鉴权失败响应:
```json
{
  "code": 40001,
  "msg": "Unauthorized",
  "result": null
}
```

系统错误响应:
```json
{
  "code": 50000,
  "msg": "Internal Error",
  "result": null
}
```

**响应字段说明:**
- `success`: 签到是否成功 (boolean)
- `message`: 签到结果消息 (string)
- `timestamp`: 签到时间戳 (string, ISO 8601格式)

### 3. 健康检查

检查服务状态。

**请求信息:**
- **URL**: `/health`
- **方法**: `GET`
- **鉴权**: 不需要

**请求示例:**
```bash
curl -X GET "http://127.0.0.1:1357/health"
```

**响应示例:**
```json
{
  "code": 0,
  "msg": "Success",
  "result": "OK"
}
```

## 错误码说明

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 鉴权失败 |
| 500 | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 40000 | 参数错误 |
| 40001 | 用户未登录/鉴权失败 |
| 50000 | 系统内部错误 |

**注意：** 业务错误码在响应的 `code` 字段中返回，与HTTP状态码不同。

## 鉴权错误响应

当鉴权失败时，返回以下格式：

```json
{
  "code": 40001,
  "msg": "Unauthorized",
  "result": null
}
```

**常见鉴权错误场景：**
- 缺少鉴权信息：未提供任何鉴权头部或参数
- API Key 无效：提供的 API Key 与配置不匹配
- Token 无效：提供的 Token 不在允许列表中

## API 使用限制和注意事项

### 使用限制

1. **请求频率限制**
   - 建议单个用户每分钟不超过 60 次请求
   - 超过限制可能导致临时封禁

2. **数据有效期**
   - 签到列表数据实时更新，建议缓存时间不超过 5 分钟
   - 签到操作具有时效性，过期签到将失败

3. **参数限制**
   - `openId` 长度限制：1-64 字符
   - `courseId` 和 `signId` 必须为正整数
   - GPS 坐标精度：经度范围 -180 到 180，纬度范围 -90 到 90

### 重要注意事项

1. **鉴权要求**
   - 所有需要鉴权的接口都必须提供有效的 API Key 或 Bearer Token
   - 生产环境强烈建议配置鉴权，避免未授权访问

2. **GPS 签到**
   - GPS 签到需要提供准确的经纬度信息
   - 坐标精度建议至少保留 6 位小数
   - 签到位置与课程要求位置偏差过大将导致签到失败

3. **服务配置**
   - 服务默认运行在 `127.0.0.1:1357`
   - 支持 CORS 跨域请求
   - 所有时间相关字段使用服务器本地时间

4. **错误处理**
   - 客户端应正确处理各种错误码和异常情况
   - 建议实现重试机制，但避免频繁重试
   - 系统错误时建议稍后重试

5. **数据安全**
   - 请妥善保管 API Key 和 Token，避免泄露
   - 建议定期轮换鉴权凭据
   - 不要在客户端代码中硬编码鉴权信息

6. **兼容性**
   - API 版本向后兼容，但建议关注更新通知
   - 响应格式可能根据业务需求进行调整

## 服务配置和环境变量

### 环境变量配置

| 环境变量名 | 说明 | 是否必需 | 默认值 | 示例 |
|-----------|------|----------|--------|------|
| `TIICHERMATE_API_KEY` | API Key 鉴权密钥 | 否 | 无 | `your-secret-api-key` |
| `TIICHERMATE_TOKENS` | 允许的 Token 列表（逗号分隔） | 否 | 无 | `token1,token2,token3` |

### 配置示例

#### 开发环境配置
```bash
# 设置 API Key
export TIICHERMATE_API_KEY="dev-api-key-123"

# 或者设置多个 Token
export TIICHERMATE_TOKENS="dev-token-1,dev-token-2"
```

#### 生产环境配置
```bash
# 设置强密钥
export TIICHERMATE_API_KEY="prod-secure-key-$(openssl rand -hex 32)"

# 设置多个访问 Token
export TIICHERMATE_TOKENS="user-token-1,user-token-2,admin-token"
```

### 服务启动

#### 使用 Cargo 启动
```bash
# 开发模式
cargo run

# 发布模式
cargo run --release
```

#### 使用环境变量启动
```bash
# 设置环境变量并启动
TIICHERMATE_API_KEY="your-key" cargo run

# 或者从文件加载环境变量
source .env && cargo run
```

### 服务信息

- **默认地址：** `127.0.0.1:1357`
- **支持协议：** HTTP/1.1
- **支持方法：** GET, POST, DELETE
- **CORS 支持：** 是（允许所有来源）
- **健康检查：** `/health`

### 日志和调试

服务运行时会输出以下信息：
- 请求日志：包含请求参数和响应状态
- 错误日志：包含详细的错误信息
- 鉴权日志：鉴权成功/失败的记录

### 部署建议

1. **反向代理**
   - 建议使用 Nginx 或 Apache 作为反向代理
   - 配置 SSL/TLS 加密
   - 设置适当的超时时间

2. **监控**
   - 监控服务健康状态
   - 设置请求频率告警
   - 记录关键业务指标

3. **安全**
   - 定期轮换 API Key 和 Token
   - 限制服务器访问权限
   - 使用防火墙保护服务端口
