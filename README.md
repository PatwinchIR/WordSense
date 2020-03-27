# WordSense
A web app that allows annotators to annotate words with its meanings for data collected in CHILDES-DB.

# Set up the Environment

For first set up, make a virtualenv in the project root and install the dependencies in `requirements.txt`:

`virtualenv -p <path to appropriate python>`    
`source bin/activate`  
`pip install -r requirements.txt`  

For working on the app thereafter, you will just run:

`source bin/activate`

Look on Heroku or ask project staff for env variables (there are many!) Add these to `.profile` and source it (`source ~/.profile`)

To get the frontend dependencies run `yarn install` in the project root (may need to remove the babel library from the dev packages -- this might be because I've messed up my enviroment with another project)

# Copy Production Data to Local Postgres 

Get a postgres server *version 10 or later* running on your machine (e.g. postgres.app for OS X), and make a new database called wordsense.

Instead of migrating, we just use a complete dump from the production server with pg_dump, and restore it with pg_restore

`pg_dump postgres://<pg_user>:<pg_password>@<aws_host>:<port>/wordsense -Ft > wordsense_dump.tar`

Then load the data dump into the database:

`pg_restore -U postgres -p <password> -d wordsense wordsense_dump.tar`

# Start Django

In the virtual environment above, start Django with the runserver management command:

`python manage.py runserver 0.0.0.0:5000`

Backend logging will continue in that terminal session

# Start Frontend

For running locally, make sure that the following is commented in in `src/constants.js` so that the frontend hits the appropriate port for the backend:

`export const BASE_URL = “http://localhost:5000”;`

To start the frontend, open another terminal and do:

`yarn run start` (this will open on port 3000; note that the app is hitting Django at 5000)

Frontend logging will continue in that terminal session
