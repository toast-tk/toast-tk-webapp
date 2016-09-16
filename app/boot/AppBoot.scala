package boot

import controllers.mongo._
import java.util.logging.{Logger => JLogger}

import play.api.Logger
import java.io.IOException

import de.flapdoodle.embed.mongo.{Command, MongodExecutable, MongodProcess, MongodStarter}
import de.flapdoodle.embed.process.distribution.GenericVersion
import de.flapdoodle.embed.process.distribution.Distribution
import de.flapdoodle.embed.mongo.config.{ArtifactStoreBuilder, DownloadConfigBuilder, MongodConfigBuilder, Net, RuntimeConfigBuilder, Storage}
import de.flapdoodle.embed.process.runtime.Network
import de.flapdoodle.embed.mongo.distribution.Versions
import de.flapdoodle.embed.process.config.io.ProcessOutput
import de.flapdoodle.embed.process.io.directories.UserTempDirInPlatformTempDir
import de.flapdoodle.embed.process.extract.UserTempNaming
import toast.engine.DAOJavaWrapper
import com.github.jmkgreen.morphia.logging.MorphiaLoggerFactory
import com.github.jmkgreen.morphia.logging.slf4j.SLF4JLogrImplFactory

object MongoExeFactory {
  def apply(port: Int, versionNumber: String, dataPath:String) = {
      val command = Command.MongoD
      val runtimeConfig = new RuntimeConfigBuilder()
          .defaultsWithLogger(command, JLogger.getLogger("embed.mongo"))
          .artifactStore(new ArtifactStoreBuilder()
                              .defaults(command)
                              .tempDir(new UserTempDirInPlatformTempDir())
                              .executableNaming(new UserTempNaming())
                              .download(new DownloadConfigBuilder().defaultsForCommand(command))
                        )
          .processOutput(ProcessOutput.getDefaultInstanceSilent())
          .build()
      val runtime = MongodStarter.getInstance(runtimeConfig)
      val replication = new Storage(dataPath,null,0)
      val config = new MongodConfigBuilder()
          .version(Versions.withFeatures(new GenericVersion(versionNumber)))
          .replication(replication)
          .net(new Net("localhost", port, Network.localhostIsIPv6())).build()
      val distribution = Distribution.detectFor(config.version())
      val files = runtimeConfig.getArtifactStore().extractFileSet(distribution)
      Logger("play-embed-mongo").info(s"Starting MongoDB on port $port. This might take a while the first time due to the download of MongoDB.")
      (runtime.prepare(config) , files.executable())
  }
}

object AppBoot extends play.api.GlobalSettings {

  val KeyMongoDbUrl = "mongo.db.url"
  val KeyPort = "embed.mongo.port"
  val KeyMongoDbVersion = "embed.mongo.dbversion"
  val KeyJnlpAddr= "jnlp.host"
  
  var db: MongoConnector = _
  var jnlpHost: String = "" 
  private var _mongoExe: MongodExecutable = _
  private var process: MongodProcess = _

  MorphiaLoggerFactory.reset()
  MorphiaLoggerFactory.registerLogger(classOf[SLF4JLogrImplFactory])

  override def beforeStart(app: play.api.Application): Unit = {
    Logger.info(s"[+] Preparing Toast Tk Web App environment..")
    val conf: play.api.Configuration = app.configuration
    jnlpHost = conf.getString(KeyJnlpAddr).getOrElse(throw new RuntimeException(s"$KeyJnlpAddr is missing in your configuration"))
    if (app.mode.equals(play.api.Mode.Dev)) {
      val enabled = conf.getBoolean("embed.mongo.enabled").getOrElse(false);
       if(enabled){
          startLocalMongoInstance(app) 
          Logger.info(s"[+] Connecting to local mongoDB instance !")
          db = MongoConnector()
       }else{
          val mongoUrl = conf.getString(KeyMongoDbUrl).getOrElse("localhost")
          Logger.info(s"[+] Connecting to mongoUrl: $mongoUrl")
          db = MongoConnector(mongoUrl)
       }
    } else {
       val enabled = conf.getBoolean("embed.mongo.enabled").getOrElse(false);
       if(enabled){
          startLocalMongoInstance(app)
          Logger.info(s"[+] Connecting to local mongoDB instance !")
          db = MongoConnector()
       }else {
          val mongoUrl = conf.getString(KeyMongoDbUrl).getOrElse(throw new RuntimeException(s"$KeyMongoDbUrl is missing in your configuration"))
          Logger.info(s"[+] Connecting to mongoUrl: $mongoUrl")
          db = MongoConnector(mongoUrl)
       }
    } 
    db match {
      case conn: MongoConnector => Logger.info(s"[+] DB connection established..")
      case _ => Logger.error(s"[-] DB connection not established..")
    }
  }

  override def onStart(app: play.api.Application): Unit = {
    Logger.info(s"[+] Initializing DB settings...")
    
    def persistDefaultConfiguration(confId: Option[String]) = {
      var congifMap = Map[String, List[ConfigurationSyntax]]()
      val fixtureDescriptorList = DAOJavaWrapper.actionAdapterSentenceList
      for (descriptor <- fixtureDescriptorList) {
        val fixtureType: String = descriptor.fixtureType
        val fixtureName: String = descriptor.name
        val fixturePattern: String = descriptor.pattern
        val key = fixtureType +":"+fixtureName
        val newConfigurationSyntax: ConfigurationSyntax = ConfigurationSyntax(fixturePattern, fixturePattern, descriptor.description)
        val syntaxRows = congifMap.getOrElse(key, List[ConfigurationSyntax]())
        val newSyntaxRows =  newConfigurationSyntax :: syntaxRows
        congifMap = congifMap + (key -> newSyntaxRows)
      }
      val configurationRows = for ((k,v) <- congifMap) yield( ConfigurationRow(k.split(":")(0),k.split(":")(1),v) )
      db.saveConfiguration(MacroConfiguration(confId, "default", configurationRows.toList))
    }

    import scala.concurrent.ExecutionContext.Implicits.global
    db.init()
    db.loadDefaultConfiguration().map {
      configuration => configuration match {
        case None => {
          persistDefaultConfiguration(None)
        }
        case Some(conf) => {
          persistDefaultConfiguration(conf.id)
        }
      }
    }
  }

  override def onStop(app: play.api.Application): Unit = {
    db.close()
    stopMongo()
  }

  def stopMongo() {
    try {
        if (_mongoExe != null) {
          Logger.info(s"[+] Stopping MongoExe.")
          _mongoExe.stop()
        }
    } finally {
        if (process != null){
          Logger.info(s"[+] Stopping MongoD.")
          process.stop()
        } 
    }
  }

  def startLocalMongoInstance(app: play.api.Application): Unit = {
      Logger.info("[+] Loading local mongo instance...");
      val conf: play.api.Configuration = app.configuration
      val port = conf.getInt(KeyPort).getOrElse(throw new RuntimeException(s"$KeyPort is missing in your configuration"))
      
      val portOpened = scala.util.Try {
        val socket = new java.net.Socket()
        socket.connect(new java.net.InetSocketAddress("127.0.0.1", port),200)
        socket.close()
        port
      }.getOrElse(-1) == port;

      if(!portOpened){
        val dataPath = conf.getString("embed.mongo.data").getOrElse(throw new RuntimeException(s"embed.mongo.data path is missing in your configuration"))
        val versionNumber = conf.getString(KeyMongoDbVersion).getOrElse(throw new RuntimeException(s"$KeyMongoDbVersion is missing in your configuration"))
        val(_mongoExe, exePath) = MongoExeFactory(port, versionNumber, dataPath)
        Logger.info(s"[+] Mongod exe path: $exePath")
        try {
            process = _mongoExe.start()
            Logger.info("[+] Local mongo instance was successfully started !");
        } catch {
            case e: IOException => {
              val message = s"""Maybe the MongoDB instance is damaged, will try to repair it !"""
              Logger.info(message)
              tryToRepairAndStartLocalMongoDB(dataPath, exePath, _mongoExe)
            }
        }
      }
      else{
        Logger.error(s"Port $port already opened, Local mongo instance not created, using existing one !");
      }
  }

  def tryToRepairAndStartLocalMongoDB(dbPath: String, exePath: java.io.File, mongoExe: MongodExecutable) {
    Logger.info(s"[+] Repairing MongoDB instance...")
    import scala.sys.process.Process
    def localRepairProcess = {
      val cmd = exePath.getAbsolutePath()  + " --dbpath=\"" + dbPath + "\" --repair"
      Logger.info(s"[+] Command line: $cmd")
      val pBuilder = Process(cmd)
      val exitCode = pBuilder.!
      exitCode == 0
    }
    try {
        if(exePath.exists() && localRepairProcess){
          Logger.info(s"[+] Repair Suceeded, restarting local MongoDb instance...")
          process = mongoExe.start()
          Logger.info("[+] Local mongo instance was successfully started !");
        }else{
          throw new Exception(s"Unable to activate local mongo db instance !")
        }
        //
    } catch{
      case e: Exception => {
        Logger.error(s"[-] Unable to activate local mongo db instance !")
        throw new Exception(s"Unable to activate local mongo db instance !", e)
      }
    }
  }
}