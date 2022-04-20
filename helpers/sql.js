const { BadRequestError } = require("../expressError");


/** Takes in object of data and schema for data structure. Manipulates
 * data for SQL query.
 * Returns: {
 * setCols : `"first_name"=$1, "last-name"=$2...`
 * values: ["michael", "test", ...]
 * } */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
