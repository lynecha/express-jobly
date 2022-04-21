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
    console.log(finalIdList);
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




// /************************************** update */

// describe("update", function () {
//   const updateData = {
//     name: "New",
//     description: "New Description",
//     numEmployees: 10,
//     logoUrl: "http://new.img",
//   };

//   test("works", async function () {
//     let company = await Company.update("c1", updateData);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateData,
//     });

//     const result = await db.query(
//       `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`);
//     expect(result.rows).toEqual([{
//       handle: "c1",
//       name: "New",
//       description: "New Description",
//       num_employees: 10,
//       logo_url: "http://new.img",
//     }]);
//   });

//   test("works: null fields", async function () {
//     const updateDataSetNulls = {
//       name: "New",
//       description: "New Description",
//       numEmployees: null,
//       logoUrl: null,
//     };

//     let company = await Company.update("c1", updateDataSetNulls);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateDataSetNulls,
//     });

//     const result = await db.query(
//       `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`);
//     expect(result.rows).toEqual([{
//       handle: "c1",
//       name: "New",
//       description: "New Description",
//       num_employees: null,
//       logo_url: null,
//     }]);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.update("nope", updateData);
//       fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });

//   test("bad request with no data", async function () {
//     try {
//       await Company.update("c1", {});
//       fail();
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
// });

// /************************************** remove */

// describe("remove", function () {
//   test("works", async function () {
//     await Company.remove("c1");
//     const res = await db.query(
//       "SELECT handle FROM companies WHERE handle='c1'");
//     expect(res.rows.length).toEqual(0);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.remove("nope");
//       fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
