[![Build Status](https://travis-ci.org/toast-tk/toast-tk-webapp.svg?branch=master)](https://travis-ci.org/toast-tk/toast-tk-webapp)  

# Toast TK - Web Application
Toast Tk Web App is the collaborative platform to support test automation and documentation for your Agile projet team.

# Demo

The webapp is currently deployed on hero for [DEMO](https://toast-tk.herokuapp.com).

# Install

## Environment pre-requisites:
- Java 8
- scala 2.11.8
- sbt 0.13.8
- Mongodb 3.x
- Node 6.9.1

## Installation steps:
* Clone The project
* Install and Launch a local Mongo Database
* Define the environment properties that are part of the application.conf
```
MONGOHQ_URL: mongodb db uri, for a local and default install -> "mongodb://localhost:27017/play_db"
SENDGRID_RECIPIENTS: list of administrator emails separated by a comma ","
SENDGRID_APIKEY: valid sendgrid api key if you are willing to use the registration functionality
```
* Launch the webapp
```
> sbt run

* Default username/password: admin/admin
```

# Contribution

Toast TK is a young ![Open Source Love](https://badges.frapsoft.com/os/v3/open-source.svg?v=103) project.  

For contribution rules and guidelines, See [CONTRIBUTING.md](https://github.com/toast-tk/toast-tk-engine/blob/snapshot/CONTRIBUTING.md)

If you'd like to help, [get in touch](https://gitter.im/toast-tk/toast-tk-engine) and let us know how you'd like to help. We love contributors!! 

# Licence
See [Toast-tk Apache License 2.0](https://github.com/toast-tk/toast-tk-engine/blob/snapshot/LICENSE.md)
