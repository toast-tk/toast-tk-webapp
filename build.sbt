name := "redplay"

version := "1.0-SNAPSHOT"

scalaVersion := "2.10.3"

// SNCF Resolver
//resolvers += "Synaptix Maven Releases Repository" at "http://s76cllcfakr.si.fret.sncf.fr:8090/nexus/content/repositories/releases/"

// LOCAL Resolver
resolvers += "Local Maven Repository" at "file:/Users/blackbox/.m2/repository"

libraryDependencies ++= Seq(
  "org.reactivemongo" %% "reactivemongo" % "0.10.0",
  "org.webjars" % "jquery" % "1.7.2",
  "org.webjars" % "angularjs" % "1.3.0",
  "org.webjars" % "requirejs" % "2.1.1",
  "org.webjars" % "webjars-play" % "2.1.0-1",
  "org.webjars" % "bootstrap" % "3.2.0-1",
  "com.synaptix.toast" % "toast-tk-dao" % "1.3-rc2",
  "com.synaptix.toast" % "toast-tk-automation-client" % "1.3-rc2",
  "com.synaptix.toast" % "toast-tk-runtime" % "1.3-rc2",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "1.47.0"
)     

// Run r.js (RequireJS optimizer) when building the app for production
//pipelineStages := Seq(rjs)

// The r.js optimizer won't find jsRoutes so we must tell it to ignore it
//RjsKeys.paths += ("jsRoutes" -> ("/jsroutes" -> "empty:"))

play.Project.playScalaSettings
