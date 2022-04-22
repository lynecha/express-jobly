"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "Manager",
    salary: 50000,
    equity: 0.003,
    companyHandle: "c3"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u4Token}`);
      resp.body.job.equity = resp.body.job.equity.toString();
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {id: jobIds[3], ...resp.body.job}
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        title: "new job"
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        title: "Manager",
        salary: "50000",
        equity: 0.003,
        companyHandle: "c3"
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

});

/************************************** GET /jobs*/

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    resp.body.jobs.map(job => delete job.id);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "Barista",
          salary: 25000,
          equity: "0",
          companyHandle: "c2"
        },
        {
          title: "Full-Stack Developer",
          salary: 180000,
          equity: "0.025",
          companyHandle: "c1"
        },
        {
          title: "Software Engineer",
          salary: 150000,
          equity: "0",
          companyHandle: "c1"
        }
       ]
    });
  });

  test("test for query searches", async function () {
    const resp = await request(app).get("/jobs").query({
      title: "software"
    });
    resp.body.jobs.map(job => delete job.id);
    expect(resp.body.jobs).toEqual([{
      title: "Software Engineer",
      salary: 150000,
      equity: "0",
      companyHandle: "c1"
    }]);
    expect(resp.statusCode).toEqual(200);
  });

  test("test for bad query searches resulting in error", async function () {
    try {
      const resp = await request(app).get("/jobs").query({
        "salary": "lots of money"
      });
    }
    catch (err) {
      expect(err.message).toEqual('instance.salary is not of a type(s) integer');
    }
  });




  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
          id: jobIds[0],
          title: "Software Engineer",
          salary: 150000,
          equity: "0",
          companyHandle: "c1"
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
          id: jobIds[0],
          title: "Software Engineer",
          salary: 150000,
          equity: "0",
          companyHandle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "I'm a new job.",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[0],
        title: "I'm a new job.",
        salary: 150000,
        equity: "0",
        companyHandle: "c1"
    },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
    .patch(`/jobs/${jobIds[0]}`)
      .send({
        title: "I can't let you do that",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        name: "No way, man",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobIds[0]}`)
      .send({
        id: 777,
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
    .patch(`/jobs/${jobIds[0]}`)
      .send({
        salary: "I'm not a number",
      })
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: jobIds[0].toString() });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobIds[0]}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
