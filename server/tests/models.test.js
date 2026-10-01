import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import { Room, User } from "../src/models/index.js";

const validUser = (overrides = {}) =>
  new User({
    name: "Sam Student",
    email: "Sam.Student@Example.edu",
    password: "plain-text-for-save-hook",
    role: "mentee",
    college: "Example University",
    ...overrides,
  });

const validRoom = (overrides = {}) =>
  new Room({
    hostId: new mongoose.Types.ObjectId(),
    title: "Portfolio review",
    ...overrides,
  });

test("models register once and email has a unique database index", () => {
  assert.equal(mongoose.models.User, User);
  assert.equal(mongoose.models.Room, Room);
  assert.equal(
    User.schema.indexes().some(([keys, options]) => keys.email === 1 && options.unique === true),
    true,
  );
});

test("user normalizes email and defaults skills and bio to arrays", async () => {
  const user = validUser();

  await user.validate();

  assert.equal(user.email, "sam.student@example.edu");
  assert.deepEqual(user.skills, []);
  assert.deepEqual(user.bio, []);
});

test("user rejects invalid roles and malformed emails", async () => {
  const invalidRole = validUser({ role: "admin" });
  const invalidEmail = validUser({ email: "not-an-email" });

  await assert.rejects(invalidRole.validate(), mongoose.Error.ValidationError);
  await assert.rejects(invalidEmail.validate(), mongoose.Error.ValidationError);
});

test("password is excluded from default projections", () => {
  assert.equal(User.schema.path("password").options.select, false);
});

test("mentor role creates a validated mentor profile", async () => {
  const mentor = validUser({ role: "mentor" });

  await mentor.validate();

  assert.equal(mentor.mentorProfile.pricing.hourlyRate, 0);
  assert.deepEqual(mentor.mentorProfile.availability, []);
  assert.deepEqual(mentor.mentorProfile.domainExpertise, []);
});

test("room defaults to scheduled and rejects unknown states", async () => {
  const room = validRoom();
  await room.validate();

  assert.equal(room.status, "scheduled");
  assert.equal(Room.schema.options.timestamps, true);

  const invalidRoom = validRoom({ status: "cancelled" });
  await assert.rejects(invalidRoom.validate(), mongoose.Error.ValidationError);
});

test("room enforces participant capacity and unique queue entries", async () => {
  const duplicateParticipant = new mongoose.Types.ObjectId();
  const room = validRoom({
    maxParticipants: 1,
    activeParticipants: [duplicateParticipant, new mongoose.Types.ObjectId()],
    joinRequests: [
      { userId: duplicateParticipant },
      { userId: duplicateParticipant },
    ],
  });

  await assert.rejects(room.validate(), (error) => {
    assert.ok(error instanceof mongoose.Error.ValidationError);
    assert.ok(error.errors.activeParticipants);
    assert.ok(error.errors.joinRequests);
    return true;
  });
});

test("room reports missing join-request users as a validation error", async () => {
  const room = validRoom({ joinRequests: [{}] });

  await assert.rejects(room.validate(), (error) => {
    assert.ok(error instanceof mongoose.Error.ValidationError);
    assert.ok(error.errors["joinRequests.0.userId"]);
    return true;
  });
});