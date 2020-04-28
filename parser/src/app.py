import logging

from github import Github

from parser import Parser
from storage import StorageConnectionConfig, Storage

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)

    github = Github('db38e8cbf731f8d03cff6b9a15300f68486dcd69')
    connection_config = StorageConnectionConfig(
        driver='postgres',
        host='127.0.0.1',
        port=5432,
        schema='covid_19',
        user='admin',
        password='LGJlnSB55cntxfOcwv4klVTXIWwG+G1X'
    )
    storage = Storage(connection_config)
    last_update_date = storage.get_last_update_date()

    if last_update_date:
        # We need to remove last available report to eliminate possibility of inserting duplicates for this day
        storage.delete_report(last_update_date)

    parser = Parser(github, last_update_date)

    for status_report in parser.parse():
        storage.save_daily_report(status_report)
