const { italic } = require("colors");
const { sqlForPartialUpdate } = require("./sql");


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

