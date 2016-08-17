package controllers.mongo.project

import controllers.mongo.IdentifiableCollection
import reactivemongo.api.collections.bson.BSONCollection


import scala.concurrent.ExecutionContext.Implicits.global

case class ProjectCollection(collection: BSONCollection) extends IdentifiableCollection[Project](collection) {

}
