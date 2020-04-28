# Dashboard

*Dashboard* is a project designed for parsing and analyzing COVID-19 data.

## Description

This project contains the following modules:
- [parser](parser) is a small Python application designed for parsing COVID-19 data and saving it in PostgreSQL database 
- [notebook](notebook) is a Jupyter notebook used for running *parser* and updating the database with fresh COVID-19 data each hour
- [backend](backend) is an Express.js REST API used for accessing COVID-19 data by *frontend*
- [frontend](frontend) is an Angular dashboard used for analyzing COVID-19 data

Also, this project contains some additional files:
- [docker-compose.yml](docker-compose.yml) is Docker Compose file which can be used to run PostgreSQL database in Docker
- [database.env](database.env) is file containing default PostgreSQL credentials and used in *docker-compose.yml* file
- [github.env](github.env) is a file containing GitHub access key needed to use GitHub Content API which in turn is used to parse COVID-19 data by *parser*


## Usage

To start working with the project it's required set up a database. It can be done manually or using *docker-compose.yml* file: 
```bash
docker-compose up -d
```

After the database is up you can start parsing COVID-19 data using either [parser](parser) or [notebook](notebook) projects.
Please refer to README.md files in the corresponding folders.
 