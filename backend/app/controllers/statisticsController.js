import dbQuery from "../db/dbQuery";

import { errorMessage, successMessage, status } from "../helpers/status";

class InvalidFilterError extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidFilterError);
    }

    this.name = "InvalidFilterError";
  }
}

const getFilterStatement = (req) => {
  const validFilters = ["region", "province", "city"];
  let filterStatement = "";

  if (req.parameters) {
    for (let i = 0; i < req.parameters.length; i++) {
      const filter = validFilters[i];

      if (!filter in req.parameters) {
        throw InvalidFilterError(`Missing ${filter} filter`);
      }

      const filterValue = req.parameters[filter];

      if (!filterStatement) {
        filterStatement = "where ";
      } else {
        filterStatement += " and ";
      }

      filterStatement += `${filter} = '${filterValue}'`;
    }
  }

  return filterStatement;
};

const getRegionStatisticsHelper = async (req, res, query) => {
  console.info(
    `Starting fetching region statistics using the following parameters ${res.parameters}`
  );

  try {
    const { rows } = await dbQuery.query(query);
    const dbResponse = rows;

    if (dbResponse[0] === undefined) {
      errorMessage.error = "There are no daily reports";
      return res.status(status.success).send(errorMessage);
    }

    successMessage.data = dbResponse;

    console.info("Region statistics has been successfully fetched");

    return res.status(status.success).send(successMessage);
  } catch (error) {
    console.error(error);

    errorMessage.error = error.message;
    return res.status(status.error).send(errorMessage);
  }
};

/**
 * Fetches COVID-19 total statistics
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const getTotalStatistics = async (req, res) => {
  console.info("Started fetching total statistics");

  const query = `
  with update_info as
  (
    select
    date_trunc('day', max(last_update)) as last_update_date
    from daily_reports
  )
  select
    sum(active) as active,
    sum(confirmed) as confirmed,
    sum(deaths) as deaths,
    sum(recovered) as recovered,
    max(dr.last_update) as "lastUpdate"
  from daily_reports as dr
  inner join update_info as ui on date_trunc('day', dr.last_update) = ui.last_update_date
  ;`;

  try {
    const { rows } = await dbQuery.query(query);
    const dbResponse = rows;

    if (dbResponse[0] === undefined) {
      errorMessage.error = "There are no daily reports";
      return res.status(status.notfound).send(errorMessage);
    }

    successMessage.data = dbResponse[0];

    console.info(
      `Total statistics has been successfully fetched: ${JSON.stringify(
        dbResponse[0]
      )}`
    );

    return res.status(status.success).send(successMessage);
  } catch (error) {
    console.error(error);

    errorMessage.error = error.message;
    return res.status(status.error).send(errorMessage);
  }
};

/**
 * Fetches COVID-19 world statistics
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const getWorldStatistics = async (req, res) => {
  return getRegionStatisticsHelper(
    req,
    res,
    `
      with
      update_info as
      (
        select
          date(max(last_update)) as last_update_date
        from daily_reports
      ),
      statistics as
      (
        select
          dr.region,
          sum(dr.active) as active,
          sum(dr.confirmed) as confirmed,
          max(dr.confirmed) as max_confirmed,
          sum(dr.deaths) as deaths,
          sum(dr.recovered) as recovered,
          max(dr.last_update) as lastUpdate
        from daily_reports as dr
        inner join update_info as ui on date(dr.last_update) = ui.last_update_date
        where
          (dr.active != 0 or dr.confirmed != 0 or dr.deaths != 0 or dr.recovered != 0)
        group by dr.region
      ),
      coordinates as
      (
        select
          dr.region,
          max(dr.latitude) as latitude,
          max(dr.longitude) as longitude
        from daily_reports as dr
        inner join statistics as s on dr.region = s.region and dr.confirmed = s.max_confirmed
        inner join update_info as ui on date(dr.last_update) = ui.last_update_date
        group by dr.region
      )
      select
        s.region,
        c.latitude,
        c.longitude,
        s.active,
        s.confirmed,
        s.deaths,
        s.recovered,
        s.lastUpdate
      from statistics as s
      inner join coordinates as c on s.region = c.region
      order by confirmed desc`
  );
};

/**
 * Fetches COVID-19 region statistics
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const getRegionStatistics = async (req, res) => {
  return getRegionStatisticsHelper(
    req,
    res,
    `
      with update_info as
      (
        select
          date(max(last_update)) as last_update_date
        from daily_reports
      )
      select
        dr.region,
        (case dr.province when 'NaN' then null else dr.province end) as province,
        max(dr.latitude) as latitude,
        avg(dr.longitude) as longitude,
        sum(dr.active) as active,
        sum(dr.confirmed) as confirmed,
        sum(dr.deaths) as deaths,
        sum(dr.recovered) as recovered,
        max(dr.last_update) as "lastUpdate"
      from daily_reports as dr
      inner join update_info as ui on date(dr.last_update) = ui.last_update_date
      where
        dr.region = '${req.params.region}'
        and dr.province is not null
        and dr.province != 'NaN'
        and dr.province != 'Unassigned'
        and (dr.active != 0 or dr.confirmed != 0 or dr.deaths != 0 or dr.recovered != 0)
      group by dr.region, dr.province
      order by confirmed desc`
  );
};

/**
 * Fetches COVID-19 province statistics
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const getProvinceStatistics = async (req, res) => {
  return getRegionStatisticsHelper(
    req,
    res,
    `
      with update_info as
      (
        select
          date(max(last_update)) as last_update_date
        from daily_reports
      )
      select
        dr.region,
        dr.province,
        dr.city,
        dr.latitude as latitude,
        dr.longitude as longitude,
        dr.active as active,
        dr.confirmed as confirmed,
        dr.deaths as deaths,
        dr.recovered as recovered,
        dr.last_update as "lastUpdate"
      from daily_reports as dr
      inner join update_info as ui on date(dr.last_update) = ui.last_update_date
      where
        dr.region = '${req.params.region}'
        and dr.province = '${req.params.province}'
        and dr.city is not null
        and dr.city != 'NaN'
        and dr.city != 'Unassigned'
        and (dr.active != 0 or dr.confirmed != 0 or dr.deaths != 0 or dr.recovered != 0)
      order by confirmed desc`
  );
};

/**
 * Fetches COVID-19 province statistics
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const getCityStatistics = async (req, res) => {
  return getRegionStatisticsHelper(
    req,
    res,
    `
      with update_info as
      (
        select
          date(max(last_update)) as last_update_date
        from daily_reports
      )
      select
        dr.region,
        dr.province,
        dr.city,
        dr.latitude as latitude,
        dr.longitude as longitude,
        dr.active as active,
        dr.confirmed as confirmed,
        dr.deaths as deaths,
        dr.recovered as recovered,
        dr.last_update as "lastUpdate"
      from daily_reports as dr
      inner join update_info as ui on date(dr.last_update) = ui.last_update_date
      where
        dr.region = '${req.params.region}'
        and dr.province = '${req.params.province}'
        and dr.city = '${req.params.city}'
      order by confirmed desc`
  );
};

/**
 * Fetches COVID-19 daily reports
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const getTimeSeries = async (req, res) => {
  const propertyNames = Object.getOwnPropertyNames(req.query);
  const validFilters = ["region", "province", "city"];
  let filterStatement = "";

  propertyNames.forEach((propertyName) => {
    const filterType = propertyName;
    const filterValue = req.query[filterType];

    if (validFilters.indexOf(filterType) === -1) {
      errorMessage.error = `${filterType} is not a valid filter`;
      return res.status(status.notfound).send(errorMessage);
    }

    if (!filterStatement) {
      filterStatement = "where ";
    } else {
      filterStatement += " and ";
    }

    filterStatement += `${filterType} = '${filterValue}'`;
  });

  const query = `
    select
      date_trunc('day', last_update) as day,
      sum(active) as active,
      sum(confirmed) as confirmed,
      sum(deaths) as deaths,
      sum(recovered) as recovered
    from daily_reports
    ${filterStatement}
    group by date_trunc('day', last_update)
    order by confirmed desc
    `;

  try {
    const { rows } = await dbQuery.query(query);
    const dbResponse = rows;

    if (dbResponse[0] === undefined) {
      errorMessage.error = "There are no daily reports";
      return res.status(status.notfound).send(errorMessage);
    }

    successMessage.data = dbResponse;

    return res.status(status.success).send(successMessage);
  } catch (error) {
    console.error(error);
    return res.status(status.notfound).send(errorMessage);
  }
};

/**
 * Fetches COVID-19 daily reports
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const getDailyReports = async (req, res) => {
  const query = `
    SELECT
      region,
      province,
      city,
      latitude,
      longitude,
      last_update,
      active,
      confirmed,
      deaths,
      recovered
    FROM daily_reports`;

  try {
    const { rows } = await dbQuery.query(query);
    const dbResponse = rows;

    if (dbResponse[0] === undefined) {
      errorMessage.error = "There are no daily reports";
      return res.status(status.notfound).send(errorMessage);
    }

    successMessage.data = dbResponse;
    return res.status(status.success).send(successMessage);
  } catch (error) {
    console.error(error);
    return res.status(status.notfound).send(errorMessage);
  }
};

export {
  getTotalStatistics,
  getWorldStatistics,
  getRegionStatistics,
  getProvinceStatistics,
  getCityStatistics,
  getTimeSeries,
};
