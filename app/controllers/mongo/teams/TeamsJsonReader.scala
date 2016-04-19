package controllers.mongo.teams

import controllers.parsers.WebPageElement
import controllers.parsers.EntityField
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.json.Writes._
import play.api.libs.json.Reads._
import reactivemongo.bson.BSONDocumentReader
import reactivemongo.bson.BSONDocument
import reactivemongo.bson.BSONDocumentWriter
import reactivemongo.bson.BSONObjectID


case class Team(id: Option[String],
                name: String,
                description: String,
                admin: String,
                writeAccess: Option[List[String]],
                readAccess: Option[List[String]]
                )

object Team{
  implicit val reader: Reads[Team]= (
      (__ \ "id").readNullable[String] and
      (__ \ "name").read[String] and
      (__ \ "description").read[String] and
      (__ \ "admin").read[String] and
      (__ \ "writeAccess").readNullable[List[String]] and
      (__ \ "readAccess").readNullable[List[String]])(Team.apply(_,_,_,_,_,_))

  implicit val writer: Writes[Team] = (
      (__ \ "id").writeNullable[String] and
      (__ \ "name").write[String] and
      (__ \ "description").write[String] and
      (__ \ "admin").write[String] and
      (__ \ "writeAccess").writeNullable[List[String]] and
      (__ \ "readAccess").writeNullable[List[String]])(unlift(Team.unapply))
/*
  implicit val teamFormat = Json.format[Team]*/
  
  implicit object BSONReader extends BSONDocumentReader[Team] {
    def read(doc: BSONDocument): Team = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val description = doc.getAs[String]("description").get
      val admin = doc.getAs[String]("admin").get

      val writeAccess =   doc.getAs[List[BSONObjectID]]("writeAccess").get.map(x => x.stringify)
      val readAccess = doc.getAs[List[BSONObjectID]]("readAccess").get.map(x => x.stringify)
/*

      val writeAccess = doc.getAs[List[BSONObjectID]]("writeAccess").getOrElse(List()).stringify
      val readAccess = doc.getAs[List[BSONObjectID]]("readAccess").getOrElse(List()).stringify*/
      Team(Option[String](id), name ,description, admin,  Option[List[String]](writeAccess),  Option[List[String]](readAccess))
    }
  }

  implicit object BSONWriter extends BSONDocumentWriter[Team] {
    def write(team: Team): BSONDocument =
      team.id match {
        case None =>  BSONDocument("name"-> team.name,
                                   "description"-> team.description,
                                   "admin"-> team.admin,
                                   "writeAccess" -> team.writeAccess, 
                                   "readAccess" -> team.readAccess)
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get),
                                                  "name" -> team.name,
                                                  "description" -> team.description,
                                                  "admin"-> team.admin,
                                                  "writeAccess" -> team.writeAccess, 
                                                  "readAccess" -> team.readAccess
                                                  )
      }
  }
}
