package controllers.mongo.repository

import controllers.mongo.{RepositoryImpl, AutoSetupConfigWithRefs, DBRef}
import controllers.parsers.{WebPageElementBSONWriter, WebPageElement}
import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.api.commands.UpdateWriteResult
import reactivemongo.bson.{BSONObjectID, BSONDocument}

import scala.concurrent.Future
import scala.util.{Success, Failure}
import scala.concurrent.ExecutionContext.Implicits.global

case class RepositoryCollection(collection: BSONCollection, elementCollection: BSONCollection) {

  def saveAutoConfiguration(conf: RepositoryImpl) {
    val elementsToPersist: List[WebPageElement] = conf.rows.getOrElse(List())
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
      id = conf.id, name = conf.name, cType = conf.cType, rows = Some(dbRefs)
    )

    println("[+] successfully saved configuration elements, persisting configuration..")
    autoSetupWithRefs.id match {
      case None => collection.insert(autoSetupWithRefs).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted repository updates !")
      }
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(autoSetupWithRefs.id.get)),autoSetupWithRefs, upsert = true).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[=] successfully saved repository updates !")
      }
    }
  }

  /**
   * We return a future
   */
  def saveContainerElement(element: BSONDocument): Future[UpdateWriteResult] = {
    elementCollection.update(BSONDocument("_id" -> element.get("_id").get),element,upsert=true)
  }
}
