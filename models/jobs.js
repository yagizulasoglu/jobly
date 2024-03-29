'use strict';

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   *  data should be {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, company_handle}
   */
  static async create({ title, salary, equity, companyHandle }) {

    const result = await db.query(`
      INSERT INTO jobs (
        title,
        salary,
        equity,
        company_handle
        )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        title,
        salary,
        equity,
        company_handle`,
      [title, salary, equity, companyHandle],
    );
    const job = result.rows[0];

    return job;
  }

  /** Finds all companies
   * Takes optional search parameters {title, minSalary, hasEquity}
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * If optional provided, filters list by search params
   * */
  static async findAll(query) {

    const keys = Object.keys(query);
    const whereClause = this._whereBuilder(query, keys);

    const querySql = `
    SELECT id, title, salary, equity, company_handle
      FROM jobs
       ${whereClause}`;

    const values = Object.values(query);
    const result = await db.query(querySql, [...values],);

    return result.rows;
  }

   /** Takes an object from a query string.
   * {title, minSalary, hasEquity}
   * They are optional and do not need to have all 3.
   * Filter jobs according to the query string.
   *
   * Returns "WHERE ..."
   * */

   static _whereBuilder(query, keys) {
    let idx = 0;
    console.log("keys", keys)
    const filterParams = keys.map((colName) => {
      if (colName === 'title') {
        idx++;
        query.title = `%${query.title}%`;
        return `"title" ILIKE $${idx}`;
      } else if (colName === 'minSalary') {
        idx++;
        return `"salary" >= $${idx}`;
      } else if (colName === 'hasEquity' && query.hasEquity) {
        return `"equity" > 0`;
      }
    });

    console.log("filterParams", filterParams);
    if (filterParams.length === 0) {
      filterParams.push('');
    }

    let whereClause = filterParams.join(' AND ');

    if (whereClause.length > 0) {
      whereClause = 'WHERE ' + whereClause;
    }


    return whereClause;
  }

  /** Given a job id, return data about job
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   throws NotFoundError if job not found
   */
  static async get(id) {
    const result = await db.query(`
      SELECT id,
             title,
             salary,
             equity,
             company_handle
      FROM jobs
      WHERE id = $1`,
      [id]);

    if (!result.rows[0]) {
      throw new NotFoundError('Job not found');
    }

    return result.rows[0];
  }

  /** Update job data with 'data'
   *
   * This is a "partial update" --- doesn't need to contain every field
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not Found
   */
  static async update(id, data) {
    if (data.id || data.companyHandle) {
      throw new BadRequestError('Cannot update id or company handle');
    }
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
      WHERE id = ${idVarIdx}
      RETURNING
          id,
          title,
          salary,
          equity,
          company_handle`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return job;
  }

  /** Delete given job from database
   *
   * Throws NotFoundError if company not found.
   */
  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);

    const job = result.rows[0];
    if (!job) {
      throw new NotFoundError('Job not found');
    }
  }
}

module.exports = Job;