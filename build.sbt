name := "toast-tk-webapp"

version := "1.3-rc4"

scalaVersion := "2.11.7"

resolvers += "Synaptix" at "http://nexus.synaptix-labs.com/content/repositories/snapshots/"

resolvers += "Typesafe" at http://repo.typesafe.com/typesafe/releases/

libraryDependencies ++= Seq(
  "org.reactivemongo" % "reactivemongo_2.11" % "0.11.7",
  "org.webjars" % "jquery" % "1.7.2",
  "org.webjars" % "angularjs" % "1.3.0",
  "org.webjars" % "requirejs" % "2.1.1",
  "org.webjars" % "webjars-play" % "2.1.0-1",
  "org.webjars" % "bootstrap" % "3.2.0-1",
  "com.synaptix.toast" % "toast-tk-runtime" % "1.0.0-SNAPSHOT",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "1.50.0"
)

//play.Project.playScalaSettings
