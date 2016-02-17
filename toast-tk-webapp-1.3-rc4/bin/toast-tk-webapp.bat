@REM toast-tk-webapp launcher script
@REM
@REM Environment:
@REM JAVA_HOME - location of a JDK home dir (optional if java on path)
@REM CFG_OPTS  - JVM options (optional)
@REM Configuration:
@REM TOAST_TK_WEBAPP_config.txt found in the TOAST_TK_WEBAPP_HOME.
@setlocal enabledelayedexpansion

@echo off

if "%TOAST_TK_WEBAPP_HOME%"=="" set "TOAST_TK_WEBAPP_HOME=%~dp0\\.."

set "APP_LIB_DIR=%TOAST_TK_WEBAPP_HOME%\lib\"

rem Detect if we were double clicked, although theoretically A user could
rem manually run cmd /c
for %%x in (!cmdcmdline!) do if %%~x==/c set DOUBLECLICKED=1

rem FIRST we load the config file of extra options.
set "CFG_FILE=%TOAST_TK_WEBAPP_HOME%\TOAST_TK_WEBAPP_config.txt"
set CFG_OPTS=
if exist %CFG_FILE% (
  FOR /F "tokens=* eol=# usebackq delims=" %%i IN ("%CFG_FILE%") DO (
    set DO_NOT_REUSE_ME=%%i
    rem ZOMG (Part #2) WE use !! here to delay the expansion of
    rem CFG_OPTS, otherwise it remains "" for this loop.
    set CFG_OPTS=!CFG_OPTS! !DO_NOT_REUSE_ME!
  )
)

rem We use the value of the JAVACMD environment variable if defined
set _JAVACMD=%JAVACMD%

if "%_JAVACMD%"=="" (
  if not "%JAVA_HOME%"=="" (
    if exist "%JAVA_HOME%\bin\java.exe" set "_JAVACMD=%JAVA_HOME%\bin\java.exe"
  )
)

if "%_JAVACMD%"=="" set _JAVACMD=java

rem Detect if this java is ok to use.
for /F %%j in ('"%_JAVACMD%" -version  2^>^&1') do (
  if %%~j==java set JAVAINSTALLED=1
  if %%~j==openjdk set JAVAINSTALLED=1
)

rem BAT has no logical or, so we do it OLD SCHOOL! Oppan Redmond Style
set JAVAOK=true
if not defined JAVAINSTALLED set JAVAOK=false

if "%JAVAOK%"=="false" (
  echo.
  echo A Java JDK is not installed or can't be found.
  if not "%JAVA_HOME%"=="" (
    echo JAVA_HOME = "%JAVA_HOME%"
  )
  echo.
  echo Please go to
  echo   http://www.oracle.com/technetwork/java/javase/downloads/index.html
  echo and download a valid Java JDK and install before running toast-tk-webapp.
  echo.
  echo If you think this message is in error, please check
  echo your environment variables to see if "java.exe" and "javac.exe" are
  echo available via JAVA_HOME or PATH.
  echo.
  if defined DOUBLECLICKED pause
  exit /B 1
)


rem We use the value of the JAVA_OPTS environment variable if defined, rather than the config.
set _JAVA_OPTS=%JAVA_OPTS%
if "!_JAVA_OPTS!"=="" set _JAVA_OPTS=!CFG_OPTS!

rem We keep in _JAVA_PARAMS all -J-prefixed and -D-prefixed arguments
rem "-J" is stripped, "-D" is left as is, and everything is appended to JAVA_OPTS
set _JAVA_PARAMS=
set _APP_ARGS=

:param_loop
call set _PARAM1=%%1
set "_TEST_PARAM=%~1"

if ["!_PARAM1!"]==[""] goto param_afterloop


rem ignore arguments that do not start with '-'
if "%_TEST_PARAM:~0,1%"=="-" goto param_java_check
set _APP_ARGS=!_APP_ARGS! !_PARAM1!
shift
goto param_loop

:param_java_check
if "!_TEST_PARAM:~0,2!"=="-J" (
  rem strip -J prefix
  set _JAVA_PARAMS=!_JAVA_PARAMS! !_TEST_PARAM:~2!
  shift
  goto param_loop
)

if "!_TEST_PARAM:~0,2!"=="-D" (
  rem test if this was double-quoted property "-Dprop=42"
  for /F "delims== tokens=1,*" %%G in ("!_TEST_PARAM!") DO (
    if not ["%%H"] == [""] (
      set _JAVA_PARAMS=!_JAVA_PARAMS! !_PARAM1!
    ) else if [%2] neq [] (
      rem it was a normal property: -Dprop=42 or -Drop="42"
      call set _PARAM1=%%1=%%2
      set _JAVA_PARAMS=!_JAVA_PARAMS! !_PARAM1!
      shift
    )
  )
) else (
  if "!_TEST_PARAM!"=="-main" (
    call set CUSTOM_MAIN_CLASS=%%2
    shift
  ) else (
    set _APP_ARGS=!_APP_ARGS! !_PARAM1!
  )
)
shift
goto param_loop
:param_afterloop

set _JAVA_OPTS=!_JAVA_OPTS! !_JAVA_PARAMS!
:run
 
set "APP_CLASSPATH=%APP_LIB_DIR%\..\conf\;%APP_LIB_DIR%\toast-tk-webapp.toast-tk-webapp-1.3-rc4-sans-externalized.jar;%APP_LIB_DIR%\org.scala-lang.scala-library-2.11.7.jar;%APP_LIB_DIR%\com.typesafe.play.twirl-api_2.11-1.1.1.jar;%APP_LIB_DIR%\org.apache.commons.commons-lang3-3.4.jar;%APP_LIB_DIR%\com.typesafe.play.play-server_2.11-2.4.3.jar;%APP_LIB_DIR%\com.typesafe.play.play_2.11-2.4.3.jar;%APP_LIB_DIR%\com.typesafe.play.build-link-2.4.3.jar;%APP_LIB_DIR%\com.typesafe.play.play-exceptions-2.4.3.jar;%APP_LIB_DIR%\org.javassist.javassist-3.19.0-GA.jar;%APP_LIB_DIR%\com.typesafe.play.play-iteratees_2.11-2.4.3.jar;%APP_LIB_DIR%\org.scala-stm.scala-stm_2.11-0.7.jar;%APP_LIB_DIR%\com.typesafe.config-1.3.0.jar;%APP_LIB_DIR%\com.typesafe.play.play-json_2.11-2.4.3.jar;%APP_LIB_DIR%\com.typesafe.play.play-functional_2.11-2.4.3.jar;%APP_LIB_DIR%\com.typesafe.play.play-datacommons_2.11-2.4.3.jar;%APP_LIB_DIR%\joda-time.joda-time-2.8.1.jar;%APP_LIB_DIR%\org.joda.joda-convert-1.7.jar;%APP_LIB_DIR%\com.fasterxml.jackson.core.jackson-core-2.5.4.jar;%APP_LIB_DIR%\com.fasterxml.jackson.core.jackson-annotations-2.5.4.jar;%APP_LIB_DIR%\com.fasterxml.jackson.core.jackson-databind-2.5.4.jar;%APP_LIB_DIR%\com.fasterxml.jackson.datatype.jackson-datatype-jdk8-2.5.4.jar;%APP_LIB_DIR%\com.fasterxml.jackson.datatype.jackson-datatype-jsr310-2.5.4.jar;%APP_LIB_DIR%\com.typesafe.play.play-netty-utils-2.4.3.jar;%APP_LIB_DIR%\org.slf4j.slf4j-api-1.7.12.jar;%APP_LIB_DIR%\org.slf4j.jul-to-slf4j-1.7.12.jar;%APP_LIB_DIR%\org.slf4j.jcl-over-slf4j-1.7.12.jar;%APP_LIB_DIR%\ch.qos.logback.logback-core-1.1.3.jar;%APP_LIB_DIR%\ch.qos.logback.logback-classic-1.1.3.jar;%APP_LIB_DIR%\com.typesafe.akka.akka-actor_2.11-2.3.13.jar;%APP_LIB_DIR%\com.typesafe.akka.akka-slf4j_2.11-2.3.13.jar;%APP_LIB_DIR%\commons-codec.commons-codec-1.10.jar;%APP_LIB_DIR%\xerces.xercesImpl-2.11.0.jar;%APP_LIB_DIR%\xml-apis.xml-apis-1.4.01.jar;%APP_LIB_DIR%\javax.transaction.jta-1.1.jar;%APP_LIB_DIR%\com.google.inject.guice-4.0.jar;%APP_LIB_DIR%\javax.inject.javax.inject-1.jar;%APP_LIB_DIR%\aopalliance.aopalliance-1.0.jar;%APP_LIB_DIR%\com.google.inject.extensions.guice-assistedinject-4.0.jar;%APP_LIB_DIR%\com.typesafe.play.play-netty-server_2.11-2.4.3.jar;%APP_LIB_DIR%\io.netty.netty-3.10.4.Final.jar;%APP_LIB_DIR%\com.typesafe.netty.netty-http-pipelining-1.1.4.jar;%APP_LIB_DIR%\com.google.code.gson.gson-2.5.jar;%APP_LIB_DIR%\org.reactivemongo.reactivemongo_2.11-0.11.7.jar;%APP_LIB_DIR%\org.reactivemongo.reactivemongo-bson-macros_2.11-0.11.7.jar;%APP_LIB_DIR%\org.scala-lang.scala-compiler-2.11.7.jar;%APP_LIB_DIR%\org.scala-lang.scala-reflect-2.11.7.jar;%APP_LIB_DIR%\org.scala-lang.modules.scala-xml_2.11-1.0.4.jar;%APP_LIB_DIR%\org.scala-lang.modules.scala-parser-combinators_2.11-1.0.4.jar;%APP_LIB_DIR%\org.reactivemongo.reactivemongo-bson_2.11-0.11.7.jar;%APP_LIB_DIR%\org.webjars.angularjs-1.3.0.jar;%APP_LIB_DIR%\org.webjars.requirejs-2.1.1.jar;%APP_LIB_DIR%\org.webjars.webjars-play-2.1.0-1.jar;%APP_LIB_DIR%\javassist.javassist-3.12.1.GA.jar;%APP_LIB_DIR%\dom4j.dom4j-1.6.1.jar;%APP_LIB_DIR%\org.webjars.webjars-locator-0.3.jar;%APP_LIB_DIR%\commons-lang.commons-lang-2.6.jar;%APP_LIB_DIR%\org.webjars.bootstrap-3.2.0-1.jar;%APP_LIB_DIR%\org.webjars.jquery-1.11.1.jar;%APP_LIB_DIR%\com.synaptix.toast.toast-tk-runtime-1.0.0-SNAPSHOT.jar;%APP_LIB_DIR%\org.thymeleaf.thymeleaf-2.1.4.RELEASE.jar;%APP_LIB_DIR%\ognl.ognl-3.0.8.jar;%APP_LIB_DIR%\org.unbescape.unbescape-1.1.0.RELEASE.jar;%APP_LIB_DIR%\org.yaml.snakeyaml-1.16.jar;%APP_LIB_DIR%\org.apache.commons.commons-collections4-4.1.jar;%APP_LIB_DIR%\com.synaptix.toast.toast-tk-adapters-1.0.0-SNAPSHOT.jar;%APP_LIB_DIR%\com.google.guava.guava-18.0.jar;%APP_LIB_DIR%\org.reflections.reflections-0.9.9-RC1.jar;%APP_LIB_DIR%\com.synaptix.toast.toast-tk-adapters-api-1.0.0-SNAPSHOT.jar;%APP_LIB_DIR%\com.synaptix.toast.toast-tk-dao-api-1.0.0-SNAPSHOT.jar;%APP_LIB_DIR%\org.apache.logging.log4j.log4j-api-2.2.jar;%APP_LIB_DIR%\org.apache.logging.log4j.log4j-core-2.2.jar;%APP_LIB_DIR%\commons-io.commons-io-2.4.jar;%APP_LIB_DIR%\commons-beanutils.commons-beanutils-1.8.3.jar;%APP_LIB_DIR%\commons-logging.commons-logging-1.1.1.jar;%APP_LIB_DIR%\junit.junit-4.11.jar;%APP_LIB_DIR%\org.hamcrest.hamcrest-core-1.3.jar;%APP_LIB_DIR%\com.google.inject.extensions.guice-multibindings-3.0.jar;%APP_LIB_DIR%\com.synaptix.toast.toast-tk-dao-1.0.0-SNAPSHOT.jar;%APP_LIB_DIR%\com.github.jmkgreen.morphia.morphia-1.2.3.jar;%APP_LIB_DIR%\org.mongodb.mongo-java-driver-2.11.0.jar;%APP_LIB_DIR%\cglib.cglib-nodep-2.2.2.jar;%APP_LIB_DIR%\com.thoughtworks.proxytoys.proxytoys-1.0.jar;%APP_LIB_DIR%\com.google.code.findbugs.jsr305-3.0.0.jar;%APP_LIB_DIR%\com.synaptix.toast.toast-tk-runtime-api-1.0.0-SNAPSHOT.jar;%APP_LIB_DIR%\com.synaptix.toast.toast-tk-rest-utils-1.0.0-SNAPSHOT.jar;%APP_LIB_DIR%\com.sun.jersey.jersey-client-1.17.1.jar;%APP_LIB_DIR%\org.json.json-20090211.jar;%APP_LIB_DIR%\de.flapdoodle.embed.de.flapdoodle.embed.mongo-1.50.0.jar;%APP_LIB_DIR%\de.flapdoodle.embed.de.flapdoodle.embed.process-1.50.0.jar;%APP_LIB_DIR%\net.java.dev.jna.jna-4.0.0.jar;%APP_LIB_DIR%\net.java.dev.jna.jna-platform-4.0.0.jar;%APP_LIB_DIR%\org.apache.commons.commons-compress-1.3.jar;%APP_LIB_DIR%\toast-tk-webapp.toast-tk-webapp-1.3-rc4-assets.jar"
set "APP_MAIN_CLASS=play.core.server.ProdServerStart"

if defined CUSTOM_MAIN_CLASS (
    set MAIN_CLASS=!CUSTOM_MAIN_CLASS!
) else (
    set MAIN_CLASS=!APP_MAIN_CLASS!
)

rem Call the application and pass all arguments unchanged.
"%_JAVACMD%" !_JAVA_OPTS! !TOAST_TK_WEBAPP_OPTS! -cp "%APP_CLASSPATH%" %MAIN_CLASS% !_APP_ARGS!

@endlocal


:end

exit /B %ERRORLEVEL%
