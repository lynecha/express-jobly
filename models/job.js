"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForSearchQuery } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, company_handle(FKEY references companies) }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, companyHandle}) {
    // const duplicateCheck = await db.query(
    //   `SELECT handle
    //        FROM companies
    //        WHERE handle = $1`,
    //   [handle]);

    // if (duplicateCheck.rows[0])
    //   throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO jobs(
          title,
          salary,
          equity,
          company_handle)
           VALUES
             ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all job listings.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {

    const jobsRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Find all job listings.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findByCompanyHandle(companyHandle) {

    const jobsRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE company_handle = $1
           ORDER BY title`,
           [companyHandle]);
    return jobsRes.rows;
  }




  /** Searches database based on the query string passed in.
   * If empty query string then defaults to all*/
  static async search(query) {

    const { sqlQuery, values } = this.sqlForSearchQuery(query);
    const jobs = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle as "companyHandle"
           FROM jobs
           WHERE ${sqlQuery}
           ORDER BY title`,
      values
    );

    if (!jobs.rows[0]) throw new NotFoundError();
    return jobs.rows;
  }


  /** Given a job id, return info on job listing.
   *
   * Returns { id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job listing: ${id}`);

    return job;
  }

  /** Update job listing with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        title: "title",
        salary: "salary",
        equity: "equity"
      });
    const idVarIdx = "$" + (values.length + 1);
    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job listing: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job listing: ${id}`);

    return job;
  }

  static sqlForSearchQuery(queryObj) {
    if(queryObj.title) queryObj.title = `%${queryObj.title}%`

    const keys = Object.keys(queryObj);
    let sqlQuery = [];

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === "title") {
        sqlQuery.push(`title ILIKE $${i + 1}`);
      }
      if (keys[i] === "salary") {
        sqlQuery.push(`salary >= $${i + 1}`);
      }
      if (keys[i] === "equity" && queryObj["equity"] !== 0) {
        sqlQuery.push(`equity >= $${i + 1}`);
      }
      else if (keys[i] === "equity" && queryObj["equity"] == 0) {
          delete queryObj.equity;
      }
    }
    const values = Object.values(queryObj);

    return {
      sqlQuery: sqlQuery.join(" AND "),
      values
    };
  }


}


module.exports = Job;
