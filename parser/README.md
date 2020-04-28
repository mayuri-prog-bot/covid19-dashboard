# Parser

*parser* is a small Python application designed for parsing COVID-19 data and saving it in PostgreSQL database.

There are two options to work with this project: 
run it directly or run it via Jupyter notebook residing in [notebook](../notebook) project.

If you prefer to run this project directly you will need to do the following:
1. Create a Python virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install Python dependencies:
```bash
python -m pip install -r requirements.txt
```

3. Create a GitHub personal token using the [following instruction](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line).

4. Update GitHub and database credentials in [app.py](src/app.py) if needed.

5. Run app.py script:
```bash
python app.py
```