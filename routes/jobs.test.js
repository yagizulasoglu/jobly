"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Company = require("../models/company.js");
const Job = require('../models/jobs.js');

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /jobs */

describe("POST /jobs", function () {

  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };
  const newJob = {
    title: "Developer",
    salary: 100000,
    equity: 0.1,
    companyHandle: "new",
  };

  test("ok for admins", async function () {
    await Company.create(newCompany);
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Developer",
        salary: 100000,
        equity: "0.1",
        company_handle: "new",
      },
    });
  });

  test("unauth error for non-admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    await Company.create(newCompany);
    const resp = await request(app)
        .post("/jobs")
        .send({
          company_handle: "new",
          salary: 10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    await Company.create(newCompany);
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Developer",
          salary: "Too much",
          equity: 0.1,
          companyHandle: "new"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "Developer",
              salary: 100000,
              equity: "0.1",
              company_handle: "c1",
            }
          ],
    });
  });

  test("filtering by query string", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "Developer" });

      expect(resp.statusCode).toEqual(200);
      expect(resp.body.jobs).toEqual([{
        id: expect.any(Number),
        title: "Developer",
        salary: 100000,
        equity: "0.1",
        company_handle: "c1",
      }])
  })

  test("Throws error when extra query fields", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ title: "Developer", id:'blah' });

      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toEqual({
        "error": {
          "message": [
            "instance is not allowed to have the additional property \"id\""
          ],
          "status": 400
        }
      })
  })

  test("Throws error when salary is a non-integer", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({ minSalary: "apple" });

      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toEqual({
        "error": {
          "message": [
            "instance.minSalary is not of a type(s) integer"
          ],
          "status": 400
        }
      })
  })
});

/************************************** GET /jobs/:id */


describe("GET /jobs/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Developer",
        salary: 100000,
        equity: "0.1",
        company_handle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/job/0`);
    expect(resp.statusCode).toEqual(404);
  });
});


/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "Developer-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Developer-new",
        salary: 100000,
        equity: "0.1",
        company_handle: "c1",
      },
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "Developer-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "Developer-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "Developer-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          id: 1,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

});