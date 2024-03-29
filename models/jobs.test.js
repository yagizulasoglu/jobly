"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const Job = require('./jobs.js');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
/*
        id,
        title,
        salary,
        equity,
        company_handle`,
*/
describe('create', function () {
  const newJob = {
    title: 'tester',
    salary: 100000,
    equity: 0.1,
    companyHandle: 'new'
  }

  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test ('works', async function () {
    await Company.create(newCompany);
    let job = await Job.create(newJob)
    expect(job).toEqual({
        id: expect.any(Number),
        title: 'tester',
        salary: 100000,
        equity: '0.1',
        company_handle: 'new'
    })
  })

  // test('does not work: empty input', async function () {
  //   await Company.create(newCompany);
  //   let res = await Job.create({})

  //   expect(res.statusCode).toEqual(400)
  // })
})