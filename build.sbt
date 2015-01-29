name := "redplay"

version := "1.0-SNAPSHOT"

resolvers += "Local Maven Repository" at "file:///D:/Apps/m2/repository"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
  "org.reactivemongo" %% "reactivemongo" % "0.10.0",
  "org.webjars" % "jquery" % "1.7.2",
  "org.webjars" % "angularjs" % "1.3.0",
  "org.webjars" % "requirejs" % "2.1.1",
  "org.webjars" % "webjars-play" % "2.1.0-1",
  "org.webjars" % "bootstrap" % "3.2.0-1",
  "com.synaptix.redpepper" % "redpepper-dao" % "1.3-SNAPSHOT",
  "com.synaptix.redpepper" % "redpepper-automation" % "1.3-SNAPSHOT",
  "com.synaptix.redpepper" % "redpepper-runtime" % "1.3-SNAPSHOT",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "1.46.4"
)     

// Run r.js (RequireJS optimizer) when building the app for production
//pipelineStages := Seq(rjs)

// The r.js optimizer won't find jsRoutes so we must tell it to ignore it
//RjsKeys.paths += ("jsRoutes" -> ("/jsroutes" -> "empty:"))

play.Project.playScalaSettings
