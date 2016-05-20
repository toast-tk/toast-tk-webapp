name := "toast-tk-webapp"

version := "1.3-rc4"

scalaVersion := "2.11.7"

//resolvers += Resolver.mavenLocal
resolvers += "Local Maven Repository" at "file:///d:/Apps/m2/repository"

resolvers += "Synaptix" at "http://nexus.talanlabs.com/content/repositories/snapshots/"

resolvers += "Typesafe" at "http://repo.typesafe.com/typesafe/releases/"

libraryDependencies ++= Seq(
  "com.google.code.gson" % "gson" % "2.5",
  "org.reactivemongo" % "reactivemongo_2.11" % "0.11.7",
  "org.webjars" % "jquery" % "1.7.2",
  "org.webjars" % "angularjs" % "1.3.0",
  "org.webjars" % "requirejs" % "2.1.1",
  "org.webjars" % "webjars-play" % "2.1.0-1",
  "org.webjars" % "bootstrap" % "3.2.0-1",
  "com.synaptix.toast" % "toast-tk-runtime" % "0.1.2-SNAPSHOT",
  "com.synaptix.toast" % "toast-tk-dao-api" % "0.1.2-SNAPSHOT",
  "com.synaptix.toast" % "toast-tk-fest-plugin" % "0.1.2-SNAPSHOT",
  "com.synaptix.toast" % "toast-tk-selenium-plugin" % "0.1.2-SNAPSHOT",
  "com.synaptix.toast" % "toast-tk-interpret" % "0.1.2-SNAPSHOT",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "1.50.0",
  "com.pauldijou" %% "jwt-play" % "0.5.1"
)

lazy val root = (project in file(".")).enablePlugins(PlayScala)