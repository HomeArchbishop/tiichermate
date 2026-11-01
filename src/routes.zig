const std = @import("std");
const http = std.http;
const app = @import("app.zig");
const query = @import("query.zig");
const teachermate = @import("teachermate.zig");

pub fn handle(req: *http.Server.Request, ctx: app.Context) !void {
    if (req.head.method == .OPTIONS) {
        try req.respond("", .{ .status = .no_content, .extra_headers = &app.cors_headers });
        return;
    }

    const target = req.head.target;
    const path = query.pathOf(target);
    const q = query.queryOf(target);

    if (req.head.method == .GET and std.mem.eql(u8, path, "/api/active_signs")) {
        try activeSigns(req, ctx, q);
        return;
    }
    if (req.head.method == .GET and std.mem.eql(u8, path, "/api/sign_in")) {
        try signIn(req, ctx, q);
        return;
    }

    try respondMessage(req, ctx, .not_found, "Not Found");
}

fn activeSigns(req: *http.Server.Request, ctx: app.Context, q: []const u8) !void {
    const open_id = query.getParam(q, "openId") orelse {
        try respondMessage(req, ctx, .ok, "Missing openId query parameter");
        return;
    };

    const body = teachermate.getActiveSigns(ctx.client, open_id) catch |err| {
        try respondMessage(req, ctx, .ok, @errorName(err));
        return;
    };
    defer ctx.allocator.free(body);
    try req.respond(body, .{ .extra_headers = &app.cors_headers });
}

fn signIn(req: *http.Server.Request, ctx: app.Context, q: []const u8) !void {
    const open_id = query.getParam(q, "openId") orelse {
        try respondMessage(req, ctx, .ok, "Missing openId query parameter");
        return;
    };

    const course_id = query.parseU32(query.getParam(q, "courseId")) orelse 0;
    const sign_id = query.parseU32(query.getParam(q, "signId")) orelse 0;
    const lon = query.parseF64(query.getParam(q, "lon"));
    const lat = query.parseF64(query.getParam(q, "lat"));

    std.debug.print("course_id: {d}, sign_id: {d}, lon: {any}, lat: {any}\n", .{ course_id, sign_id, lon, lat });

    if (course_id == 0 or sign_id == 0) {
        try respondMessage(req, ctx, .ok, "Invalid courseId or signId");
        return;
    }

    const body = teachermate.signIn(ctx.client, open_id, .{
        .courseId = course_id,
        .signId = sign_id,
        .lon = lon,
        .lat = lat,
    }) catch |err| {
        try respondMessage(req, ctx, .ok, @errorName(err));
        return;
    };
    defer ctx.allocator.free(body);
    try req.respond(body, .{ .extra_headers = &app.cors_headers });
}

fn respondMessage(req: *http.Server.Request, ctx: app.Context, status: http.Status, message: []const u8) !void {
    const msg = try std.json.Stringify.valueAlloc(ctx.allocator, .{ .message = message }, .{});
    defer ctx.allocator.free(msg);
    try req.respond(msg, .{ .status = status, .extra_headers = &app.cors_headers });
}
