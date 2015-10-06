name := "toast-tk-webapp"

version := "1.3-rc4"

scalaVersion := "2.10.3"

resolvers += "Synaptix Maven Snapshot Repository" at "http://nexus.synaptix-labs.com/content/repositories/snapshots/"

libraryDependencies ++= Seq(
  "org.reactivemongo" %% "reactivemongo" % "0.10.0",
  "org.webjars" % "jquery" % "1.7.2",
  "org.webjars" % "angularjs" % "1.3.0",
  "org.webjars" % "requirejs" % "2.1.1",
  "org.webjars" % "webjars-play" % "2.1.0-1",
  "org.webjars" % "bootstrap" % "3.2.0-1",
  "com.wordnik" %% "swagger-play2" % "1.3.11",
  "com.synaptix.toast" % "toast-tk-runtime" % "1.3.0-SNAPSHOT",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "1.47.0"
)

play.Project.playScalaSettings
