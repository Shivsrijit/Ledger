const { normalizeAuthUser } = require("../src/utils/authUser");

describe("normalizeAuthUser", () => {
  it("coerces numeric string id to number when safe integer", () => {
    expect(normalizeAuthUser({ id: "42", role: "viewer", email: "a@b.c" })).toEqual({
      id: 42,
      role: "viewer",
      email: "a@b.c"
    });
  });

  it("keeps bigint-like string when not a safe integer", () => {
    const big = "9007199254740993";
    const u = normalizeAuthUser({ id: big, role: "Admin", email: "x@y.z" });
    expect(u.id).toBe(big);
    expect(u.role).toBe("admin");
  });

  it("returns empty role when missing", () => {
    const u = normalizeAuthUser({ id: 1 });
    expect(u.role).toBe("");
    expect(u.id).toBe(1);
  });
});
