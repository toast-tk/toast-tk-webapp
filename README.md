[![Build Status](https://travis-ci.org/toast-tk/toast-tk-webapp.svg?branch=master)](https://travis-ci.org/toast-tk/toast-tk-webapp)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f6b89c98a6a84e95a6a90f5bcba80eda)](https://www.codacy.com/app/toast-tk/toast-tk-webapp?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=toast-tk/toast-tk-webapp&amp;utm_campaign=Badge_Grade) 
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/f6b89c98a6a84e95a6a90f5bcba80eda)](https://www.codacy.com/app/toast-tk/toast-tk-webapp?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=toast-tk/toast-tk-webapp&amp;utm_campaign=Badge_Coverage)
[![License](http://img.shields.io/:license-Apache%202-red.svg)](https://github.com/toast-tk/toast-tk-engine/blob/snapshot/LICENSE.md)

# Toast-tk-webapp

<a href="http://toast-tk.io"><img src="https://github.com/toast-tk/toast-tk-webapp/blob/master/public/images/ToastLogo.png?raw=true" align="left" height="50"></a>
**Toast-tk-webapp** is the collaborative platform of Toast-Tk framework that enables you to support test automation and documentation for your Agile projet team.

The webapp is currently deployed on hero for [DEMO](https://toast-tk.herokuapp.com).

### Environment pre-requisites:
- Java 8
- scala 2.11.8
- sbt 0.13.8
- Mongodb 3.x
- Node 6.9.1

### Installation steps:
* Clone The project
* Install and Launch a local Mongo Database
* Update the environment properties `MONGOHQ_URL` `SENDGRID_RECIPIENTS` & `SENDGRID_APIKEY` in the `conf/application.conf` file with your own parameters
* Compile and start the webapp : `sbt compile` and `sbt run`

_NB: The full documentation of the webapp config and install is available in the [Wiki ](https://github.com/toast-tk/toast-tk-webapp/wiki)_📖.

# Contribution

Toast TK is a young ![Open Source Love](https://badges.frapsoft.com/os/v3/open-source.svg?v=103) project.  

For contribution rules and guidelines, See [CONTRIBUTING.md](https://github.com/toast-tk/toast-tk-engine/blob/snapshot/CONTRIBUTING.md)

If you'd like to help, [get in touch](https://gitter.im/toast-tk/toast-tk-engine) and let us know how you'd like to help. We love contributors!! 

# Licence
_Toast TK regroups multiple open source projects licensed under the Apache Software License 2._

