process.env.NODE_ENV = "test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { User } from "../src/models/User.js";
import { generateToken, verifyToken, requireAuth } from "../src/middleware/auth.js";

describe("User Password Hashing & Authentication", () => {
  it("hashes password with bcrypt and verifies matching credentials", async () => {
    const rawPassword = "SuperSecretPassword123!";
    const hash = await User.hashPassword(rawPassword);

    assert.notEqual(hash, rawPassword);
    assert.ok(hash.startsWith("$2a$") || hash.startsWith("$2b$"));

    // Verify correct password
    const dummyUser = new User({ email: "test@example.com", passwordHash: hash });
    const isMatch = await dummyUser.comparePassword(rawPassword);
    assert.equal(isMatch, true);

    // Verify wrong password fails
    const isWrong = await dummyUser.comparePassword("WrongPassword456!");
    assert.equal(isWrong, false);
  });
});

describe("JWT Token Issuance & Verification", () => {
  const sampleUserId = "65e6d0a1b2c3d4e5f6a7b8c9";

  it("generates a valid signed JWT and decodes the correct userId", () => {
    const token = generateToken(sampleUserId);
    assert.ok(typeof token === "string");
    assert.ok(token.length > 20);

    const decoded = verifyToken(token);
    assert.equal(decoded.userId, sampleUserId);
    assert.ok(decoded.exp > decoded.iat);
  });

  it("rejects invalid or tampered tokens", () => {
    assert.throws(() => verifyToken("invalid.token.string"), /invalid token|jwt/i);
    assert.throws(() => verifyToken(""), /jwt/i);
  });
});

describe("requireAuth Middleware Protection", () => {
  const sampleUserId = "65e6d0a1b2c3d4e5f6a7b8c9";
  const validToken = generateToken(sampleUserId);

  it("rejects requests with missing Authorization header (HTTP 401)", () => {
    const req = { headers: {} };
    let statusSet = null;
    let jsonSent = null;

    const res = {
      status: (s) => {
        statusSet = s;
        return {
          json: (j) => {
            jsonSent = j;
          },
        };
      },
    };

    requireAuth(req, res, () => {});
    assert.equal(statusSet, 401);
    assert.equal(jsonSent.error, "Authentication required");
  });

  it("rejects malformed Authorization headers (HTTP 401)", () => {
    const req = { headers: { authorization: "Basic 12345" } };
    let statusSet = null;

    const res = {
      status: (s) => {
        statusSet = s;
        return { json: () => {} };
      },
    };

    requireAuth(req, res, () => {});
    assert.equal(statusSet, 401);
  });

  it("rejects invalid Bearer tokens (HTTP 401)", () => {
    const req = { headers: { authorization: "Bearer totally-invalid-token" } };
    let statusSet = null;

    const res = {
      status: (s) => {
        statusSet = s;
        return { json: () => {} };
      },
    };

    requireAuth(req, res, () => {});
    assert.equal(statusSet, 401);
  });

  it("permits valid Bearer tokens and attaches req.userId", () => {
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    let nextCalled = false;

    const res = {
      status: () => ({ json: () => {} }),
    };

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.userId, sampleUserId);
  });
});
