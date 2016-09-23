package controllers.mongo.repository

import controllers.mongo.project.Project
import controllers.mongo.{Repository, Repository$, AutoSetupConfigWithRefs, DBRef}
import controllers.parsers.{WebPageElementBSONWriter, WebPageElement}
import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.api.commands.UpdateWriteResult
import reactivemongo.bson.{BSONObjectID, BSONDocument}

import scala.concurrent.{Promise, Future}
import scala.util.{Success, Failure}
import scala.concurrent.ExecutionContext.Implicits.global

case class RepositoryCollection(collection: BSONCollection, elementCollection: BSONCollection) {
  def findRepositoriesByNameAndProject(project: Project, name: String) = {
    findRepositories(BSONDocument("name" -> name, "project._id" -> project._id.get))
  }

  def findProjectSwingRepositories(project: Project): Future[List[Repository]] = {
    findRepositories(BSONDocument("type" -> "swing page", "project._id" -> project._id.get))
  }

  def findProjectWebRepositories(project: Project): Future[List[Repository]] = {
    findRepositories(BSONDocument("type" -> "web page", "project._id" -> project._id.get))
  }

  def findProjectRepositories(project: Project) = {
    findRepositories(BSONDocument("project._id" -> project._id.get))
  }

  private def findRepositories(query: BSONDocument): Future[List[Repository]] = {
    val configurationWithRefs: Future[List[AutoSetupConfigWithRefs]] = collection.find(query).sort(BSONDocument("name" -> 1)).cursor[AutoSetupConfigWithRefs]().collect[List]()
    // re-compute as repository
    def convertItems(configurationWithRef: AutoSetupConfigWithRefs): Future[Repository] = {
      configurationWithRef.rows match {
        case Some(refs) => {
          val loadedElementFutureList: Future[List[Option[WebPageElement]]] = Future.sequence(for( ref <- refs ) yield loadElement(ref.id))
          loadedElementFutureList.map(elements => Repository(
            id = configurationWithRef.id,
            name = configurationWithRef.name,
            `type` = configurationWithRef.`type`,
            rows = Some(elements.flatMap(_.toList)),
            project = configurationWithRef.project)
          )
        }
      }
    }
    val convertedListFuture: Future[List[Repository]] = configurationWithRefs.flatMap {
      configurationWithRefs => {
        val configFutureList: Future[List[Repository]] = Future.sequence(for (configurationWithRef <- configurationWithRefs) yield convertItems(configurationWithRef))
        configFutureList
      }
    }
    convertedListFuture
  }

  def saveAutoConfiguration(repository: Repository): Future[Boolean] = {
    val elementsToPersist: List[WebPageElement] = repository.rows.getOrElse(List())
    val elementAsBsonDocuments: List[BSONDocument] = for(element <- elementsToPersist) yield WebPageElementBSONWriter.write(element)
    val listOfFutures: List[Future[UpdateWriteResult]] = for(element <- elementAsBsonDocuments) yield saveContainerElement(element)
    val futureList = Future.sequence(listOfFutures)

    //once we've completed saving elements
    //we can check here through last errors if everything has been saved !
    futureList.map(_ => {
      //TODO
    })
    val dbRefs: List[DBRef] = elementAsBsonDocuments match {
      case elements: List[BSONDocument] => elements.map(element => {
        val objectId = element.getAs[BSONObjectID]("_id").get
        DBRef("elements", objectId)
      })
      case _ => List()
    }
    val autoSetupWithRefs: AutoSetupConfigWithRefs = AutoSetupConfigWithRefs (
      id = repository.id, name = repository.name, `type` = repository.`type`, rows = Some(dbRefs), project = repository.project
    )

    println("[+] successfully saved configuration elements, persisting configuration..")
    val p = Promise[Boolean]
    autoSetupWithRefs.id match {
      case None => collection.insert(autoSetupWithRefs).onComplete {
        case Failure(e) => {
          p.failure(e)
          throw e
        }
        case Success(_) => {
          p.success(true)
          println("[+] successfully inserted repository updates !")
        }
      }
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(autoSetupWithRefs.id.get)),autoSetupWithRefs, upsert = true).onComplete {
        case Failure(e) => {
          p.failure(e)
          throw e
        }
        case Success(_) =>{
          p.success(true)
          println("[=] successfully saved repository updates !")
        }
      }
    }
    p.future
  }

  def saveContainerElement(element: BSONDocument): Future[UpdateWriteResult] = {
    elementCollection.update(BSONDocument("_id" -> element.get("_id").get),element,upsert=true)
  }

  def loadElement(objectId: BSONObjectID): Future[Option[WebPageElement]] = {
    val query = BSONDocument("_id" -> objectId)
    elementCollection.find(query).one[WebPageElement]
  }
}
