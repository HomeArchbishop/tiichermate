const std = @import("std");
const http = std.http;
const server = @import("server.zig");

pub fn main(init: std.process.Init) !void {
    const io = init.io;
    const allocator = init.gpa;

    var client: http.Client = .{ .allocator = allocator, .io = io };
    defer client.deinit();

    try server.start(io, .{
        .allocator = allocator,
        .client = &client,
    });
}
