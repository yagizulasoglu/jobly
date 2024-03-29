"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * Takes optional search parameters {minEmplotees, maxEmployees, nameLike}
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * If optional provided, filters list by search params
   * */

  static async findAll(query={}) {
    // could refactor to return empty string if no filter params and combine with findAll()
    // separate query builder into own function
    if (query.minEmployees > query.maxEmployees) {
      throw new BadRequestError("Min employees cannot be higher than max employees");
    }
    const keys = Object.keys(query);
    // could move min > max check to this function
    const whereClause = this._whereBuilder(query, keys);
    // move this to whereBuilder


    const querySql = `
    SELECT handle, name, description, num_employees, logo_url
      FROM companies
       ${whereClause}`;

    const values = Object.values(query);

    const result = await db.query(querySql, [...values],);


    return result.rows;
  }

  /** Takes an object from a query string.
   * {nameLike, minEmployee, maxEmployee}
   * They are optional and do not need to have all 3.
   * Filter companies according to the query string.
   *
   * Returns "WHERE ..."
   * */


  static _whereBuilder(query, keys) {

    const filterParams = keys.map((colName, idx) => {
      if (colName === 'minEmployees') {
        return `"num_employees" >= $${idx + 1}`;
      } else if (colName === 'maxEmployees') {
        return `"num_employees" <= $${idx + 1}`;
      } else if (colName === 'nameLike') {
        query.nameLike = `%${query.nameLike}%`;
        return `"name" ILIKE $${idx + 1}`;
      }
    });

    if (filterParams.length === 0) {
      filterParams.push('');
    }

    let whereClause = filterParams.join(' AND ');
    if (whereClause.length > 0) {
      whereClause = 'WHERE ' + whereClause;
    }


    return whereClause;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
