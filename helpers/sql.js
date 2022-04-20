const { BadRequestError } = require("../expressError");


/** Takes in object of data and schema for data structure. Dynamically
 * create SQL query with data and schema.
 *
 * dataToUpdate = {firstName: "michael", lastName: "test"}
 * jsToSql = {firstName: first_name, lastName: last_name}
 *
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
/** Given a query object from query string, return a dynamically
 * created SQL query and array of values.
 * Parses string numbers into integers.
 * Throws error if minEmployees > maxEmployees.
 *
 * {name:"foo", minEmployees: "3"} =>
 * `name ILIKE $1 AND num_employees >= $2`, ["foo", 3].
 */
function sqlForSearchQuery(queryObj) {
  const minEmployees = queryObj?.minEmployees;
  const maxEmployees = queryObj?.maxEmployees;
  if(queryObj.name) queryObj.name = `%${queryObj.name}%`

  if (minEmployees > maxEmployees) {
    throw new BadRequestError("min employees is greater than max employees");
  }
  const keys = Object.keys(queryObj);
  let sqlQuery = [];

  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === "name") {
      sqlQuery.push(`name ILIKE $${i + 1}`);
    }
    if (keys[i] === "minEmployees") {
      sqlQuery.push(`num_employees >= $${i + 1}`);
    }
    if (keys[i] === "maxEmployees") {
      sqlQuery.push(`num_employees <= $${i + 1}`);
    }
  }
  const values = Object.values(queryObj);

  return {
    sqlQuery: sqlQuery.join(" AND "),
    values
  };
}

module.exports = { sqlForPartialUpdate, sqlForSearchQuery };
