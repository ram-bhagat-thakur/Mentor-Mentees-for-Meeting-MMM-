import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import mongoose from "mongoose";
import "../src/config/env.js";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { signAccessToken } from "../src/utils/jwt.js";

process.env.JWT_SECRET = randomBytes(32).toString("hex");

test(
  "mentor search filters, paginates, projects safe fields, and requires authentication",
  { skip: !process.env.MONGODB_URI },
  async () => {
    const suffix = randomUUID();
    const prefix = `mmm-search-${suffix}`;
    const college = `Northbridge University ${suffix}`;
    const company = `Atlas${suffix}`;
    const searchKeyword = `FrontSearch${suffix.replaceAll("-", "").slice(0, 8)}`;
    const skill = `React${suffix.replaceAll("-", "").slice(0, 8)}`;
    const fixtureEmails = [
      `${prefix}-mentor-one@example.edu`,
      `${prefix}-mentor-two@example.edu`,
      `${prefix}-inactive@example.edu`,
      `${prefix}-mentee@example.edu`,
    ];
    const previousSecret = process.env.JWT_SECRET;
    const temporarySecret = randomBytes(32).toString("hex");
    process.env.JWT_SECRET = temporarySecret;

    let server;

    try {
      await mongoose.connect(process.env.MONGODB_URI);
      await User.init();
      const baselineActiveMentors = await User.countDocuments({
        role: "mentor",
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      });

      const indexes = await User.collection.indexes();
      const textIndex = indexes.find((index) => index.name === "mentor_search_text");
      assert.ok(textIndex);
      assert.equal(textIndex.weights["mentorProfile.domain"], 6);

      const [mentorOne, mentorTwo, , requester] = await User.create([
        {
          name: "Avery React Mentor",
          email: fixtureEmails[0],
          password: "Fixture-Password-123",
          role: "mentor",
          college,
          skills: [skill, "Node.js"],
          bio: ["Frontend systems mentor"],
          mentorProfile: {
            company: `Northstar${suffix}`,
            domain: [searchKeyword],
          },
        },
        {
          name: "Jordan Data Mentor",
          email: fixtureEmails[1],
          password: "Fixture-Password-123",
          role: "mentor",
          college,
          skills: ["Python", "MongoDB"],
          mentorProfile: {
            company,
            domain: ["Data Engineering"],
          },
        },
        {
          name: "Inactive Mentor",
          email: fixtureEmails[2],
          password: "Fixture-Password-123",
          role: "mentor",
          college: "South Coast College",
          skills: [skill],
          isActive: false,
          mentorProfile: { company: `Northstar${suffix}`, domain: [searchKeyword] },
        },
        {
          name: "Requesting Mentee",
          email: fixtureEmails[3],
          password: "Fixture-Password-123",
          role: "mentee",
          college,
        },
      ]);

      server = app.listen(0, "127.0.0.1");
      await once(server, "listening");
      const baseUrl = `http://127.0.0.1:${server.address().port}/api/mentors`;
      const token = signAccessToken(requester);
      const headers = { authorization: `Bearer ${token}` };

      const unauthenticated = await fetch(baseUrl);
      assert.equal(unauthenticated.status, 401);

      const allMentorsResponse = await fetch(`${baseUrl}?limit=1`, { headers });
      const allMentors = await allMentorsResponse.json();
      assert.equal(allMentorsResponse.status, 200);
      assert.equal(allMentors.pagination.total, baselineActiveMentors + 2);
      assert.equal(allMentors.pagination.page, 1);
      assert.equal(allMentors.pagination.pages, baselineActiveMentors + 2);
      assert.equal(allMentors.pagination.limit, 1);
      assert.equal(allMentors.mentors.length, 1);
      assert.equal("password" in allMentors.mentors[0], false);
      assert.equal("email" in allMentors.mentors[0], false);
      assert.equal("tokens" in allMentors.mentors[0], false);

      const secondPageResponse = await fetch(`${baseUrl}?limit=1&page=2`, { headers });
      const secondPage = await secondPageResponse.json();
      assert.equal(secondPage.pagination.total, baselineActiveMentors + 2);
      assert.equal(secondPage.pagination.page, 2);
      assert.equal(secondPage.mentors.length, 1);

      const skillResponse = await fetch(`${baseUrl}?skills=${encodeURIComponent(skill)}`, { headers });
      assert.equal(skillResponse.status, 200);
      assert.equal((await skillResponse.json()).pagination.total, 1);

      const csvSkillsResponse = await fetch(
        `${baseUrl}?skills=${encodeURIComponent(`${skill},unmatched`)}`,
        { headers },
      );
      assert.equal((await csvSkillsResponse.json()).pagination.total, 1);

      const arraySkillsResponse = await fetch(
        `${baseUrl}?skills=${encodeURIComponent(skill)}&skills=unmatched`,
        { headers },
      );
      assert.equal((await arraySkillsResponse.json()).pagination.total, 1);

      const collegeResponse = await fetch(`${baseUrl}?college=${encodeURIComponent(college)}`, { headers });
      assert.equal((await collegeResponse.json()).pagination.total, 2);

      const companyResponse = await fetch(`${baseUrl}?company=${encodeURIComponent(company)}`, { headers });
      const companyResults = await companyResponse.json();
      assert.equal(companyResults.pagination.total, 1);
      assert.equal(companyResults.mentors[0].name, mentorTwo.name);

      const textResponse = await fetch(`${baseUrl}?search=${encodeURIComponent(searchKeyword)}`, { headers });
      const textResults = await textResponse.json();
      assert.equal(textResults.pagination.total, 1);
      assert.equal(textResults.mentors[0].name, mentorOne.name);

      const almaMaterResponse = await fetch(`${baseUrl}?almaMater=true`, { headers });
      const almaMaterResults = await almaMaterResponse.json();
      assert.equal(almaMaterResults.pagination.total, 2);
      assert.ok(almaMaterResults.mentors.every((mentor) => mentor.college === requester.college));

      const invalidPage = await fetch(`${baseUrl}?page=0`, { headers });
      assert.equal(invalidPage.status, 400);
    } finally {
      try {
        if (mongoose.connection.readyState === 1) {
          await User.deleteMany({ email: { $in: fixtureEmails } });
        }
      } finally {
        try {
          if (server) await new Promise((resolve) => server.close(resolve));
          await mongoose.disconnect();
        } finally {
          if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
          } else {
            process.env.JWT_SECRET = previousSecret;
          }
        }
      }
    }
  },
);