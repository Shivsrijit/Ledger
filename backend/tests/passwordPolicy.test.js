const { getPasswordStrengthMessage } = require("../src/utils/passwordPolicy");

describe("passwordPolicy", () => {
  it("accepts a reasonably strong password", () => {
    expect(getPasswordStrengthMessage("GoodPass1!")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(getPasswordStrengthMessage("Aa1!aaaa")).not.toBeNull();
  });

  it("rejects missing special character", () => {
    expect(getPasswordStrengthMessage("GoodPassword12")).not.toBeNull();
  });
});
