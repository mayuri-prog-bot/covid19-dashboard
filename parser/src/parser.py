import datetime
import io
import logging
import os
import re
from typing import Iterable

import pandas as pd
from github import Github, ContentFile


class Parser:
    """
    Parses COVID-19 daily reports using GitHub as a data feed
    """

    DAILY_REPORT_FILE_NAME_REGEX = re.compile(r'\d{2}-\d{2}-\d{4}\.csv')
    COVID_19_REPO = 'CSSEGISandData/COVID-19'
    COVID_19_DAILY_REPORTS_FOLDER = 'csse_covid_19_data/csse_covid_19_daily_reports'

    def __init__(self, github: Github, start_date: datetime) -> None:
        """
        Creates a new instance of Parser

        :param github: PyGitHub's GitHub instance
        :param start_date: Date from which we should start parsing
        """

        self._logger: logging.Logger = logging.getLogger(__name__)
        self._github: Github = github
        self._start_date: datetime = start_date

        if self._start_date:
            self._start_date = self._start_date.replace(hour=0, minute=0, second=0, microsecond=0)

    def _get_daily_report_date(self, daily_report_file: ContentFile) -> datetime:
        """
        Parses daily report's file name and returns datetime object containing the report's date
        :param daily_report_file: File name of a daily report
        :return: Report's date
        """

        file_name_without_extension = os.path.splitext(daily_report_file.name)[0]

        return datetime.datetime.strptime(file_name_without_extension, '%m-%d-%Y')

    def parse(self) -> Iterable[pd.DataFrame]:
        """
        Fetches COVID-19 reports from GitHub, parses them and returns them as pandas data frames
        :return: Iterable object containing pandas data frame with COVID-19 data
        """

        repo = self._github.get_repo(self.COVID_19_REPO)
        contents = repo.get_contents(self.COVID_19_DAILY_REPORTS_FOLDER)

        for content_file in contents:
            # Let's skip .gitignore and README.mdd files
            if not self.DAILY_REPORT_FILE_NAME_REGEX.match(content_file.name):
                continue

            self._logger.debug(f'Reading {content_file.name}')

            report_date = self._get_daily_report_date(content_file)

            if self._start_date and report_date < self._start_date:
                self._logger.debug(f'{content_file.name} was already parsed')
                continue

            buffer = io.StringIO(content_file.decoded_content.decode('utf-8'))
            data_frame = pd.read_csv(buffer)
            data_frame = data_frame.rename(
                columns={
                    'Province/State': 'province',
                    'Province_State': 'province',
                    'Country/Region': 'region',
                    'Country_Region': 'region',
                    'Admin2': 'city',
                    'Latitude': 'latitude',
                    'Lat': 'latitude',
                    'Longitude': 'longitude',
                    'Long': 'longitude',
                    'Long_': 'longitude',
                    'Last Update': 'last_update',
                    'Last_Update': 'last_update',
                    'Active': 'active',
                    'Confirmed': 'confirmed',
                    'Deaths': 'deaths',
                    'Recovered': 'recovered'
                }
            )

            if 'latitude' not in data_frame.columns:
                data_frame['latitude'] = 0.0
            if 'longitude' not in data_frame.columns:
                data_frame['longitude'] = 0.0
            if 'active' not in data_frame.columns:
                data_frame['active'] = 0

            numeric_columns = ['latitude', 'longitude', 'active', 'confirmed', 'deaths', 'recovered']

            data_frame[numeric_columns] = data_frame[numeric_columns]\
                .fillna(0)\
                .apply(pd.to_numeric)

            yield data_frame
