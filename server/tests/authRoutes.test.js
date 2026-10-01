import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import "../src/config/env.js";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { isInstitutionalEmail } from "../src/utils/emailValidator.js";
import { verifyAccessToken } from "../src/utils/jwt.js";

process.env.JWT_SECRET = randomBytes(32).toString("hex");

test("institutional email validation supports configured campus suffixes", () => {
  const previousDomains = process.env.APPROVED_CAMPUS_EMAIL_DOMAINS;
  process.env.APPROVED_CAMPUS_EMAIL_DOMAINS = "students.example.org";

  try {
    assert.equal(isInstitutionalEmail("Mentor@Example.EDU"), true);
    assert.equal(isInstitutionalEmail("student@university.ac.in"), true);
    assert.equal(isInstitutionalEmail("student@dept.students.example.org"), true);
    assert.equal(isInstitutionalEmail("student@gmail.com"), false);
    assert.equal(isInstitutionalEmail("student@fakeedu.com"), false);
  } finally {
    if (previousDomains === undefined) {
      delete process.env.APPROVED_CAMPUS_EMAIL_DOMAINS;
    } else {
      process.env.APPROVED_CAMPUS_EMAIL_DOMAINS = previousDomains;
    }
  }
});

test(
  "registration, login, and protected route integration",
  { skip: !process.env.MONGODB_URI },
  async () => {
    const registeredEmails = [];
    const previousDomains = process.env.APPROVED_CAMPUS_EMAIL_DOMAINS;
    process.env.APPROVED_CAMPUS_EMAIL_DOMAINS = "students.example.org";

    let server;
    let baseUrl;

    try {
      await mongoose.connect(process.env.MONGODB_URI);
      await User.init();

      server = app.listen(0, "127.0.0.1");
      await once(server, "listening");
      baseUrl = `http://127.0.0.1:${server.address().port}`;

      const email = `mmm-auth-test-${randomUUID()}@example.edu`;
      const password = "Valid-Route-Test-Password-123";
      registeredEmails.push(email);

      const validRegistration = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Test Mentor",
          email,
          password,
          role: "mentor",
          college: "Example University",
        }),
      });
      const registrationBody = await validRegistration.json();

      assert.equal(validRegistration.status, 201);
      assert.equal(registrationBody.user.email, email);
      assert.equal("password" in registrationBody.user, false);
      assert.equal(typeof registrationBody.token, "string");
      assert.equal(verifyAccessToken(registrationBody.token).sub, registrationBody.user.id);

      const savedUser = await User.findById(registrationBody.user.id).select("+password");
      assert.equal(await bcrypt.compare(password, savedUser.password), true);

      const rejectedRegistration = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Personal Email",
          email: `mmm-auth-test-${randomUUID()}@gmail.com`,
          password,
          role: "mentee",
          college: "Example University",
        }),
      });
      const rejectedBody = await rejectedRegistration.json();

      assert.equal(rejectedRegistration.status, 400);
      assert.match(rejectedBody.error, /institutional email/i);

      const approvedCampusEmail = `mmm-auth-test-${randomUUID()}@students.example.org`;
      registeredEmails.push(approvedCampusEmail);
      const approvedCampusRegistration = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Campus Mentee",
          email: approvedCampusEmail,
          password,
          role: "mentee",
          college: "Example Campus",
        }),
      });
      assert.equal(approvedCampusRegistration.status, 201);

      const duplicateRegistration = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate User",
          email,
          password,
          role: "mentee",
          college: "Example University",
        }),
      });
      assert.equal(duplicateRegistration.status, 409);

      const validLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginBody = await validLogin.json();
      assert.equal(validLogin.status, 200);
      assert.equal(typeof loginBody.token, "string");
      assert.equal("password" in loginBody.user, false);

      const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "Wrong-Password-123" }),
      });
      assert.equal(invalidLogin.status, 401);

      const oversizedLoginPassword = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: `${password}${"x".repeat(72)}` }),
      });
      assert.equal(oversizedLoginPassword.status, 400);

      const protectedPath = `${baseUrl}/api/auth/me`;
      const missingToken = await fetch(protectedPath);
      const invalidToken = await fetch(protectedPath, {
        headers: { authorization: "Bearer invalid.token.value" },
      });
      const validToken = await fetch(protectedPath, {
        headers: { authorization: `Bearer ${loginBody.token}` },
      });
      const protectedBody = await validToken.json();

      assert.equal(missingToken.status, 401);
      assert.equal(invalidToken.status, 401);
      assert.equal(validToken.status, 200);
      assert.equal(protectedBody.user.email, email);
    } finally {
      try {
        if (mongoose.connection.readyState === 1 && registeredEmails.length > 0) {
          await User.deleteMany({ email: { $in: registeredEmails } });
        }
      } finally {
        try {
          if (server) {
            await new Promise((resolve) => server.close(resolve));
          }

          await mongoose.disconnect();
        } finally {
          if (previousDomains === undefined) {
            delete process.env.APPROVED_CAMPUS_EMAIL_DOMAINS;
          } else {
            process.env.APPROVED_CAMPUS_EMAIL_DOMAINS = previousDomains;
          }
        }
      }
    }
  },
);