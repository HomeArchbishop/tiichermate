const std = @import("std");
const http = std.http;

const active_signs_url = "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student/active_signs";
const sign_in_url = "https://v18.teachermate.cn/wechat-api/v1/class-attendance/student-sign-in";
const referrer_base = "https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=";

const user_agent =
    \\Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36 QBCore/4.0.1326.400 QQBrowser/9.0.2524.400 Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2875.116 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63010200)
;

pub const SignInQuery = struct {
    courseId: u32,
    signId: u32,
    lon: ?f64 = null,
    lat: ?f64 = null,
};

fn request(
    client: *http.Client,
    method: http.Method,
    url: []const u8,
    open_id: []const u8,
    payload: ?[]const u8,
) ![]u8 {
    const allocator = client.allocator;
    const referer = try std.fmt.allocPrint(allocator, "{s}{s}", .{ referrer_base, open_id });
    defer allocator.free(referer);

    const extra_headers = [_]http.Header{
        .{ .name = "Accept", .value = "*/*" },
        .{ .name = "Accept-Language", .value = "zh-CN,en-US;q=0.7,en;q=0.3" },
        .{ .name = "If-None-Match", .value = "\"38-djBNGTNDrEJXNs9DekumVQ\"" },
        .{ .name = "openId", .value = open_id },
        .{ .name = "Referer", .value = referer },
    };

    var body: std.Io.Writer.Allocating = .init(allocator);
    defer body.deinit();

    const result = try client.fetch(.{
        .location = .{ .url = url },
        .method = method,
        .payload = payload,
        .response_writer = &body.writer,
        .headers = .{
            .user_agent = .{ .override = user_agent },
            .content_type = .{ .override = "application/json" },
        },
        .extra_headers = &extra_headers,
    });

    std.debug.print("Response: {s} [status] {d}\n", .{ body.written(), @intFromEnum(result.status) });
    return try body.toOwnedSlice();
}

pub fn getActiveSigns(client: *http.Client, open_id: []const u8) ![]u8 {
    return request(client, .GET, active_signs_url, open_id, null);
}

pub fn signIn(client: *http.Client, open_id: []const u8, query: SignInQuery) ![]u8 {
    const payload = try std.json.Stringify.valueAlloc(client.allocator, query, .{});
    defer client.allocator.free(payload);
    return request(client, .POST, sign_in_url, open_id, payload);
}
