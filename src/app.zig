const std = @import("std");
const http = std.http;

pub const Context = struct {
    allocator: std.mem.Allocator,
    client: *http.Client,
};

pub const cors_headers = [_]http.Header{
    .{ .name = "Access-Control-Allow-Origin", .value = "*" },
    .{ .name = "Access-Control-Allow-Methods", .value = "GET, POST, DELETE, OPTIONS" },
    .{ .name = "Access-Control-Allow-Headers", .value = "*" },
    .{ .name = "Content-Type", .value = "application/json" },
};
