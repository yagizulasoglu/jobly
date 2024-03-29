"use strict";

const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", function () {
  test("many data to update returns { 'SQL query string', [array of variables] }", function () {
    const dataToUpdate = {
      name: "New",
      description: "New Description",
      numEmployees: 1,
      logoUrl: "http://new.img"
    };
    const jsToSql = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    };
    let partialSQL = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(partialSQL).toEqual({
      setCols: `"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4`,
      values: ['New', 'New Description', 1, 'http://new.img']
    });
  });

  test("one data to update returns { 'SQL query string', [array of variables] }", function () {
    const dataToUpdate = {
      logoUrl: "http://new.img"
    };
    const jsToSql = {
      logoUrl: "logo_url",
    };
    let partialSQL = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(partialSQL).toEqual({
      setCols: `"logo_url"=$1`,
      values: ['http://new.img']
    });
  });

  test('Throws BadRequest error if empty', function () {
    try {
      let partialSQL = sqlForPartialUpdate({}, {});
      throw new Error("Should not throw this error.");
    } catch (err) {
      expect(err.message).toEqual('No data');
    }
  });
});
