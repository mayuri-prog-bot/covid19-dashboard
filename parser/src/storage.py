"""
Contains classes designed to unify work with relational databases
"""
import datetime
import logging
from dataclasses import dataclass
from logging import Logger
from typing import Optional

import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, DateTime, MetaData, Table, select, func, Float
from sqlalchemy.engine import Engine

metadata = MetaData()

# Definition of a table for storing daily reports
daily_report_table = Table(
    'daily_reports',
    metadata,
    Column('id', Integer, primary_key=True),
    Column('region', String(255), nullable=False),
    Column('province', String(255), nullable=True),
    Column('city', String(255), nullable=True),
    Column('latitude', Float, nullable=True),
    Column('longitude', Float, nullable=True),
    Column('last_update', DateTime, nullable=False),
    Column('active', Integer, nullable=True),
    Column('confirmed', Integer, nullable=True),
    Column('deaths', Integer, nullable=True),
    Column('recovered', Integer, nullable=True)
)


@dataclass
class StorageConnectionConfig:
    """
    Python data class storing connection settings
    NOTE: data class are used to eliminate constructors and simplify class declaration
    """

    driver: str
    host: str
    port: int
    schema: str
    user: str
    password: str

    @property
    def connection_string(self) -> str:
        """
        Returns a new connection string in a SQLAlchemy format
        :return: Connection string in a SQLAlchemy format
        """

        return f'{self.driver}://{self.user}:{self.password}@{self.host}:{self.port}/{self.schema}'


class Storage:
    """
    Unifies work with different databases
    """

    def __init__(self, config: StorageConnectionConfig) -> None:
        """
        Creates a new instance of Storage class

        :param config: Connection parameters
        """

        self._logger: Logger = logging.getLogger(__name__)
        self._config: StorageConnectionConfig = config
        self._engine: Optional[Engine] = None

    def _get_engine(self) -> Engine:
        """
        Creates a new SQLAlchemy engine used to create new connections and creates a database if it doesn't yet exist
        :return: SQLAlchemy engine
        """

        if self._engine is None:
            self._logger.info('Started creating a new connection')

            self._engine = create_engine(self._config.connection_string)

            self._logger.info('New connection has been successfully created')
            self._logger.info('Started creating a database schema (if it doesn\'t yet exist)')

            # NOTE: Database will be created here
            metadata.create_all(self._engine)

            self._logger.info('Database schema has been successfully created (if it didn\'t exist before)')

        return self._engine

    def save_daily_report(self, daily_report: pd.DataFrame) -> None:
        """
        Saves data from the data_frame into the database

        :param daily_report: Pandas data frame object
        :return: N/A
        """

        self._logger.info('Started saving a daily report to the database')

        with self._get_engine().connect() as connection:
            connection.execute(daily_report_table.insert(), daily_report.to_dict(orient="records"))

        self._logger.info('Successfully finished saving a daily report to the database')

    def get_last_update_date(self) -> datetime:
        """
        Returns a date of the last available report. Used for skipping already processed reports

        :return: Date of the last available report.
        """

        self._logger.info('Started fetching information about the last update date')

        with self._get_engine().connect() as connection:
            query = select([func.max(daily_report_table.c.last_update)])

            last_update_date = list(connection.execute(query))[0][0]

            self._logger.info(
                f'Finished fetching information about the last update date. '
                f'Database was updated last time on {last_update_date}')

            return last_update_date

    def delete_report(self, day: datetime) -> None:
        """
        Removes daily reports for the particular date from the database
        :param day: Day for which reports should be deleted
        :return: N/A
        """

        day = day.replace(hour=0, minute=0, second=0, microsecond=0)

        self._logger.info(f'Started deleting report for {day}')

        with self._get_engine().connect() as connection:
            connection.execute(
                daily_report_table.delete().where(func.date_trunc('day', daily_report_table.c.last_update) == day))

            self._logger.info(f'Report for {day} has been successfully deleted')
