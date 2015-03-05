package boot

import com.mongo.test.service.dao.access.project._
import com.mongo.test.guice._
import controllers.mongo.MongoConnector
import com.mongodb.Mongo
import java.util.logging.{ Logger => JLogger }
import play.api.Logger
import java.io.IOException
import de.flapdoodle.embed.mongo.{ Command, MongodStarter, MongodProcess, MongodExecutable }
import de.flapdoodle.embed.process.distribution.GenericVersion
import de.flapdoodle.embed.process.distribution.Distribution
import de.flapdoodle.embed.mongo.config.{ Net, MongodConfigBuilder, RuntimeConfigBuilder, Storage }
import de.flapdoodle.embed.mongo.runtime.Mongod
import de.flapdoodle.embed.process.runtime.Network
import de.flapdoodle.embed.mongo.distribution.Versions
import de.flapdoodle.embed.process.config.io.ProcessOutput
import de.flapdoodle.embed.process.store.IArtifactStore
import de.flapdoodle.embed.process.extract.IExtractedFileSet

object MongoExeFactory {
	def apply(port: Int, versionNumber: String, dataPath:String) = {
    	val runtimeConfig = new RuntimeConfigBuilder()
      		.defaultsWithLogger(Command.MongoD, JLogger.getLogger("embed.mongo"))
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

object Global extends play.api.GlobalSettings {

	private lazy val injector = com.google.inject.Guice.createInjector(new MongoModule());
	lazy val projectService = injector.getInstance(classOf[ProjectDaoService.Factory])create("test_project_db");
	lazy val conn = MongoConnector()

	private var _mongoExe: MongodExecutable = _
  //private var exePath: java.io.File = _
  private var process: MongodProcess = _

  val KeyPort = "embed.mongo.port"
  val KeyMongoDbVersion = "embed.mongo.dbversion"

	override def beforeStart(app: play.api.Application): Unit = {
		if (app.mode.equals(play.api.Mode.Dev)) {
             startLocalMongoInstance(app)
        } else {
             /*
             * here you can setup mongodb for production,
             * e.g. connect to remote mongodb instance
             */
             val enabled = app.configuration.getBoolean("embed.mongo.enabled").getOrElse(false);
             if(enabled){
                startLocalMongoInstance(app)
             }
        }
	}

	override def onStop(app: play.api.Application): Unit = {
		conn.close()
		stopMongo()
	}

 	def stopMongo() {
  	Logger.info(s"Stopping MongoDB.")
  	try {
    		if (_mongoExe != null) _mongoExe.stop()
  	} finally {
    		if (process != null) process.stop()
  	}
	}

	def startLocalMongoInstance(app: play.api.Application): Unit = {
      Logger.info("Loading local mongo instance...");
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
        Logger.info(s"Mongod exe path: $exePath")
        try {
            process = _mongoExe.start()
            Logger.info("Local mongo instance was successfully started !");
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
    Logger.info(s"Repairing MongoDB instance...")
    import scala.sys.process.Process
    def localRepairProcess = {
      val cmd = exePath.getAbsolutePath()  + " --dbpath=\"" + dbPath + "\" --repair"
      Logger.info(s"Command line: $cmd")
      val pBuilder = Process(cmd)
      val exitCode = pBuilder.!
      exitCode == 0
    }
    try {
        if(exePath.exists() && localRepairProcess){
          Logger.info(s"Repair Suceeded, restarting local MongoDb instance...")
          process = mongoExe.start()
          Logger.info("Local mongo instance was successfully started !");
        }else{
          throw new Exception(s"Unable to activate local mongo db instance !")
        }
        //
    } catch{
      case e: Exception => {
        Logger.error(s"Unable to activate local mongo db instance !")
        throw new Exception(s"Unable to activate local mongo db instance !", e)
      }
    }
  }
}