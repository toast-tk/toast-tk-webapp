package controllers.mongo.teams

import scala.util.{Failure, Success}

import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson.{BSONObjectID, BSONDocument}


case class TeamCollection(){

	def save(team: Team, collection: BSONCollection)  : Future[Boolean] = {
		println(s"[+] successfully gooottt team $team !")

		team.id match {
			case None => {
				Future{false} 
			}
			case _ => findTeamBy(
				BSONDocument(
					"name" -> team.name
					),
				collection
				).map{
				case None => {
					collection.insert(team).onComplete {
						case Failure(e) => throw e
						case Success(_) => println("[+] successfully inserted ${team.id} and $team !")
					}
					true
				}
				case Some(team) => {
					println(s"[+] successfully found ${team.id} and $team !")
					false
				}
			}
		}
	}


	def findTeamBy(query: BSONDocument,  collection: BSONCollection): Future[Option[Team]] = {
		collection.find(query).one[Team]
	}

}