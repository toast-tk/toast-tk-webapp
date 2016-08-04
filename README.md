Toast TK - Web App 
=======

# Toast Tk webapp Run instructions :

# 0- Clone The project
# 1- Install and Launch a local Mongo Database
* in application.conf file, check the DB configuration. It should be :

```
mongo.db.url="localhost:27017"
db.mongo.host="localhost"
```

## 3- Install dependecies & setup front end : 

```
> cd app\assets\
> npm run setup
```

## 4- Run playframework backend : 

```
> cd ../..
> sbt clean 
> sbt reload 
> sbt compile 
> sbt run
```

## 5- Run Front End angular tests :

```
> cd app\assets\
> npm run test
```


# for more information :

## Environment pre-requisites:
- sbt 0.13.8
- Scala 2.10.3
- Play 2.2.3
- Java 7
- sbt-plugins: play

# About
Proudly developed by TalanLabs