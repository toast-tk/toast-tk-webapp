name := "toast-tk-webapp"

version := "1.3-rc2"

scalaVersion := "2.10.3"

// Synaptix Resolver
//resolvers += "Synaptix Maven Releases Repository" at "http://uri/repositories/releases/"

// LOCAL Resolver
resolvers += Resolver.mavenLocal

libraryDependencies ++= Seq(
  "org.reactivemongo" %% "reactivemongo" % "0.10.0",
  "org.webjars" % "jquery" % "1.7.2",
  "org.webjars" % "angularjs" % "1.3.0",
  "org.webjars" % "requirejs" % "2.1.1",
  "org.webjars" % "webjars-play" % "2.1.0-1",
  "org.webjars" % "bootstrap" % "3.2.0-1",
  "com.synaptix.toast" % "toast-tk-runtime" % "1.3-rc2",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "1.47.0"
)     

// Run r.js (RequireJS optimizer) when building the app for production
//pipelineStages := Seq(rjs)

// The r.js optimizer won't find jsRoutes so we must tell it to ignore it
//RjsKeys.paths += ("jsRoutes" -> ("/jsroutes" -> "empty:"))

play.Project.playScalaSettings
