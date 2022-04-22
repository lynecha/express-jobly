"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  finalIdList
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create job listing", function () {
  const newJob = {
    title: "new",
    salary: 200000,
    equity: 0,
    companyHandle: "c1"
  };

  test("it creates a listing", async function () {
    let job = await Job.create(newJob);
    let jobId = job.id;
    delete job.id;
    newJob.equity = newJob.equity.toString();
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,
      [jobId]);
    expect(result.rows).toEqual([
      {
        id: jobId,
        title: "new",
        salary: 200000,
        equity: "0",
        company_handle: "c1"
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll jobs", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    jobs.map(job => delete job.id);
    expect(jobs).toEqual([
      {
        title: "job1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1"
      },
      {
        title: "job2",
        salary: 500000,
        equity: "0.5",
        companyHandle: "c1"
      },
      {
        title: "job3",
        salary: 1000000,
        equity: "0.1",
        companyHandle: "c2"
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("gets job by id", async function () {
    let job = await Job.get(finalIdList[0]);
    expect(job).toEqual({
      id: finalIdList[0],
      title: "job1",
      salary: 100000,
      equity: "0",
      companyHandle: "c1"
    });
  });

  test("not found if no such job listing", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** search */

describe("search based on a query", function () {
  test("searches based on title and salary", async function () {
    let jobs = await Job.search({ "title": "job", "salary": 600000 });
    expect(jobs).toEqual([{
      id: finalIdList[2],
      title: "job3",
      salary: 1000000,
      equity: "0.1",
      companyHandle: "c2"
    }]);
  });

  test("query with bad data", async function () {
    try {
      await Job.search({ "title": "a/?sdf?", "salary": 600000 });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});




/************************************** update */

describe("update", function () {
  const updateData = {
    title: "job4",
    salary: 100,
    equity: "0",
  };

  test("works", async function () {
    let job = await Job.update(finalIdList[0], updateData);
    expect(job).toEqual({
      id: finalIdList[0],
      ...updateData,
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title,salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
      [finalIdList[0]]);
    expect(result.rows).toEqual([{
      id: finalIdList[0],
      title: "job4",
      salary: 100,
      equity: "0",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateNullData = {
      salary: null,
      equity: null,
    };
    let job = await Job.update(finalIdList[0], updateNullData);
    expect(job).toEqual({
      id: finalIdList[0],
      title: "job1",
      ...updateNullData,
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
      [finalIdList[0]]);
    expect(result.rows).toEqual([{
      id: finalIdList[0],
      title: "job1",
      salary: null,
      equity: null,
      companyHandle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(0, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(finalIdList[0]);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=0");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
