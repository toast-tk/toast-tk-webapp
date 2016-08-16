package controllers.mongo.project

import controllers.mongo.IdentifiableCollection
import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson.{BSONDocument}

import scala.concurrent.{Promise, Future}
import scala.util.{Failure, Success}

import scala.concurrent.ExecutionContext.Implicits.global

case class ProjectCollection(collection: BSONCollection) extends IdentifiableCollection[Project](collection) {

  def list() : Future[List[Project]] ={
    val query = BSONDocument()
    val projects = collection.find(query).cursor[Project]().collect[List]()
    projects
  }

}
