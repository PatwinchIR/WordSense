# WordSense
A web app that allows annotators to annotate words with its meanings for data collected in CHILDES-DB.

# Set up the Environment

For first set up, make a virtualenv in the project root and install the dependencies in `requirements.txt`:

`virtualenv -p <path to appropriate python> .`
`source bin/activate`
`pip install -r requirements.txt`

For working on the app thereafter, you will just run:

`source bin/activate`

Look on Heroku or ask project staff for env variables (there are many!) Add these to `.profile` and source it (`source ~/.profile`)

To get the frontend dependencies run `yarn install` in the project root (may need to remove the babel library from the dev packages -- this might be because I've messed up my enviroment with another project)

# Copy Production Data to Local Postgres 

Get a postgres server running on your machine (e.g. postgres.app for OS X), and make a new database called wordsense.

Initialize the schema by running the migrations:

`python manage.py migrate ws_web` 

Note the use of the app name; without this, odd things can happen. 

Then get a dump from Heroku or ask someone with access. This dump should be made with the `--data-only` flag because the schema will be set by Django.

`pg_dump --data-only postgres://<pg_user>:<pg_password>@<aws_host>:<port>/wordsense > wordsense_dump.sql`

Then load the data dump into the database:

`psql -U postgres -p <password> wordsense < wordsense_dump.sql`

# Start Django

In the virtual environment above, start Django with the runserver management command:

`python manage.py runserver 0.0.0.0:5000`

Backend logging will continue in that terminal session

# Start Frontend

To start the frontend, open another terminal and do:

`yarn run start` (this will open on port 3000; note that the app is hitting Django at 5000)

Frontend logging will continue in that terminal session
