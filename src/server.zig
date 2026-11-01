const std = @import("std");
const http = std.http;
const app = @import("app.zig");
const routes = @import("routes.zig");

pub const listen_addr = "127.0.0.1";
pub const listen_port: u16 = 1357;

pub fn start(io: std.Io, ctx: app.Context) !void {
    const addr = try std.Io.net.IpAddress.parseIp4(listen_addr, listen_port);
    var tcp = try addr.listen(io, .{ .reuse_address = true });
    defer tcp.deinit(io);

    std.debug.print("Listening on http://{s}:{d}\n", .{ listen_addr, listen_port });

    var group: std.Io.Group = .init;
    defer group.cancel(io);

    while (true) {
        const stream = try tcp.accept(io);
        group.async(io, handleStream, .{ io, ctx, stream });
    }
}

fn handleStream(io: std.Io, ctx: app.Context, stream: std.Io.net.Stream) std.Io.Cancelable!void {
    defer stream.close(io);

    var read_buffer: [8192]u8 = undefined;
    var write_buffer: [8192]u8 = undefined;
    var reader = stream.reader(io, &read_buffer);
    var writer = stream.writer(io, &write_buffer);
    var http_server = http.Server.init(&reader.interface, &writer.interface);

    while (true) {
        var req = http_server.receiveHead() catch |err| switch (err) {
            error.HttpConnectionClosing => return,
            else => {
                std.debug.print("receiveHead error: {s}\n", .{@errorName(err)});
                return;
            },
        };
        routes.handle(&req, ctx) catch |err| {
            std.debug.print("request error: {s}\n", .{@errorName(err)});
            if (std.json.Stringify.valueAlloc(ctx.allocator, .{ .message = @errorName(err) }, .{})) |msg| {
                defer ctx.allocator.free(msg);
                req.respond(msg, .{ .status = .internal_server_error, .extra_headers = &app.cors_headers }) catch {};
            } else |_| {}
            return;
        };
    }
}
