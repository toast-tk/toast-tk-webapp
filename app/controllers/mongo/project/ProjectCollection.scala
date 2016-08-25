package controllers.mongo.project

import controllers.mongo.IdentifiableCollection
import controllers.mongo.teams.Team
import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson.BSONDocument


import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Promise, Future}
import scala.util.{Success, Failure}

case class ProjectCollection(collection: BSONCollection) extends IdentifiableCollection[Project](collection) {

  def initDefault(): Future[Project] = {
    val defaultProjectName:String = "default"
    findBy(BSONDocument(
      "name" -> defaultProjectName
    )).flatMap(
        team => team match {
          case Some(t) => Future.successful(t)
          case None => {
            val p = Promise[Project]
            val defaultProject = new Project(name=defaultProjectName)
            collection.insert(defaultProject).onComplete {
              case Failure(e) => throw e
              case Success(_) => p.success(defaultProject)
            }
            p.future
          }
        }
      )
  }

}
