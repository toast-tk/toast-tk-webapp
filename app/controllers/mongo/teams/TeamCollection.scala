package controllers.mongo.teams

import reactivemongo.api.commands.WriteResult

import scala.util.{Failure, Success}

import scala.concurrent.{Promise, Future}
import scala.concurrent.ExecutionContext.Implicits.global

import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson.{BSONObjectID, BSONDocument}


case class TeamCollection(collection: BSONCollection){

  def initDefaultTeam(): Future[Team] = {
    val defaultTeamName:String = "default"
    findTeamBy(BSONDocument(
      "name" -> defaultTeamName
    )).flatMap(
      team => team match {
        case Some(t) => Future.successful(t)
        case None => {
          val p = Promise[Team]
          val defaultTeam = new Team(Some(BSONObjectID.generate.stringify), defaultTeamName, "default team")
          collection.insert(defaultTeam).onComplete {
            case Failure(e) => throw e
            case Success(_) => p.success(defaultTeam)
          }
          val f: Future[Team] = p.future
          f
        }
      }
    )
  }

	def save(team: Team)  : Future[Boolean] = {
		team.id match {
			case None => {
				Future{false} 
			}
			case _ => findTeamBy(
				BSONDocument(
					"name" -> team.name
					)
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


	def findTeamBy(query: BSONDocument): Future[Option[Team]] = {
		collection.find(query).one[Team]
	}

	def getAllTeams() : Future[List[Team]] ={
    	val query = BSONDocument()
    	val users = collection.find(query).cursor[Team]().collect[List]()
    users
  }

}