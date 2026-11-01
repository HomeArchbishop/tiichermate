const std = @import("std");

pub fn pathOf(target: []const u8) []const u8 {
    if (std.mem.indexOfScalar(u8, target, '?')) |i| return target[0..i];
    return target;
}

pub fn queryOf(target: []const u8) []const u8 {
    if (std.mem.indexOfScalar(u8, target, '?')) |i| return target[i + 1 ..];
    return "";
}

pub fn getParam(query: []const u8, key: []const u8) ?[]const u8 {
    var it = std.mem.splitScalar(u8, query, '&');
    while (it.next()) |pair| {
        if (std.mem.indexOfScalar(u8, pair, '=')) |eq| {
            if (std.mem.eql(u8, pair[0..eq], key)) return pair[eq + 1 ..];
        } else if (std.mem.eql(u8, pair, key)) {
            return "";
        }
    }
    return null;
}

pub fn parseU32(value: ?[]const u8) ?u32 {
    const s = value orelse return null;
    return std.fmt.parseInt(u32, s, 10) catch null;
}

pub fn parseF64(value: ?[]const u8) ?f64 {
    const s = value orelse return null;
    return std.fmt.parseFloat(f64, s) catch null;
}
