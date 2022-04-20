const { italic } = require("colors");
const { sqlForPartialUpdate, sqlForSearchQuery } = require("./sql");


describe("SQL for partial update", function () {
  test("Returns correct extrapolated SQL query", function () {

    const data = {first_name: "michael", last_name: "test"}
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name"
      });

      expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2`);
      expect(values).toEqual(["michael", "test"])

  });

  test("Return Error with no data", function () {
    try{
      const data = {};
      const { setCols, values } = sqlForPartialUpdate(
        data, {});
      }
      catch(err){
        expect(err.message).toEqual("No data")
      }
  });
});

describe("SQL for Search", function () {
  test("Returns correct extrapolated SQL query", function () {
    const query = {"name": "test", "maxEmployees" : "3"}
    const { sqlQuery, values } = sqlForSearchQuery(query);

    expect(sqlQuery).toEqual("name ILIKE $1 AND num_employees <= $2");
    expect(values).toEqual(["%test%", "3"]);

  });

  test("Return Error with bad data", function () {
    try{
      const query = {"name": "test", "minEmployees": "98", "maxEmployees" : "3"}
      const result = sqlForSearchQuery(query)
      }
      catch(err){
        expect(err.message).toEqual("min employees is greater than max employees")
      }
  });
});
