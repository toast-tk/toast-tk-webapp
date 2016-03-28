Toast TK - Web App 
=======

## Environment pre-requisites:

- sbt 0.13.8
- Scala 2.10.3
- Play 2.2.3
- Java 7
- sbt-plugins: play


## Local Mongo DB config : 

* 1- Install and Launch a local Mongo Database
* 2- in application.conf file, check the DB configuration. It should be :

```
mongo.db.url="localhost:27017"
db.mongo.host="localhost"
```

* 3- Create data base and insert your collections : 

```
> use play_db

> db.createCollection("scenarii");
> db.createCollection("configuration");
> db.createCollection("elements");
> db.createCollection("repository");
```