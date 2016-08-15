name := "toast-tk-webapp"

version := "1.3-rc4"

scalaVersion := "2.11.7"

resolvers += Resolver.mavenLocal
//resolvers += "Local Maven Repository" at "file:///d:/Apps/m2/repository"

resolvers += "MavenSnapshots" at "http://nexus.talanlabs.com/content/repositories/snapshots/"

resolvers += "MavenCentral" at "https://oss.sonatype.org/content/repositories/snapshots/"

resolvers += "Typesafe" at "http://repo.typesafe.com/typesafe/releases/"

libraryDependencies ++= Seq(
  "com.google.code.gson" % "gson" % "2.5",
  "org.reactivemongo" % "reactivemongo_2.11" % "0.11.7",
  "org.webjars" % "jquery" % "1.7.2",
  "org.webjars" % "angularjs" % "1.3.0",
  "org.webjars" % "requirejs" % "2.1.1",
  "org.webjars" % "webjars-play" % "2.1.0-1",
  "org.webjars" % "bootstrap" % "3.2.0-1",
  "io.toast-tk" % "toast-tk-runtime" % "0.1.4-SNAPSHOT",
  "io.toast-tk" % "toast-tk-dao-api" % "0.1.4-SNAPSHOT",
  "io.toast-tk" % "toast-tk-selenium-plugin" % "0.1.4-SNAPSHOT",
  "io.toast-tk" % "toast-tk-interpret" % "0.1.4-SNAPSHOT",
  "de.flapdoodle.embed" % "de.flapdoodle.embed.mongo" % "1.50.0",
  "com.pauldijou" %% "jwt-play" % "0.5.1",
  "org.scalatestplus.play" %% "scalatestplus-play" % "1.5.0" % "test"
)

lazy val root = (project in file(".")).enablePlugins(PlayScala)