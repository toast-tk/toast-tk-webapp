package controllers.mongo.scenario

import controllers.mongo.project.Project
import controllers.mongo._
import controllers.mongo.repository.RepositoryCollection
import play.api.libs.json.Json
import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.api.commands.UpdateWriteResult
import scala.concurrent.duration._
import reactivemongo.bson.{BSONDocument, BSONObjectID}

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Await, Future}
import scala.util.{Failure, Success}

case class ScenarioCollection(collection: BSONCollection, repo: RepositoryCollection) extends IdentifiableCollection[Scenario](collection){

  def findProjectScenario(scenarioName: String, maybeProject: Option[Project]) = {
    val query = BSONDocument(
      "name" -> scenarioName, "project" -> maybeProject
    )
    findOneScenarioBy(query)
  }

  def findScenarioById(id: String) = {
    val query = BSONDocument(
      "_id" -> BSONObjectID(id)
    )
    findOneScenarioBy(query)
  }


  def findProjectScenarios(project: Project) = {
    val query = BSONDocument("project" -> project)
    val scenarii = collection.find(query).cursor[Scenario]().collect[List]()
    scenarii
  }

  def upsertScenario(scenario: Scenario) : Future[UpdateWriteResult] = {
    val update: Future[UpdateWriteResult] = {
      collection.update(BSONDocument("_id" -> scenario._id), updateScenario(scenario), upsert=true)
    }
    update
  }

  def findOneScenarioBy(query: BSONDocument): Future[Option[Scenario]] = {
    collection.find(query).one[Scenario]
  }


  def updateScenario(scenario: Scenario):  Scenario = {
    import scala.util.control.Breaks._
    val scenarioRows: List[ScenarioRows] = convertJsonToScenarioRows(scenario)
    println(scenarioRows)
    var outputRows = List[ScenarioRows]()
    for(row <- scenarioRows){
      var outputMappings = List[ScenarioRowMapping]()
      for(mapping <- row.mappings.getOrElse(List())){
        var mappingUpdate: Boolean = false;
        if(mapping.id.equals("component")){ //lame hack, to fix as soon as possible on editor.js side also
        val pageName = mapping.value.split("[.]")(0)
          val componentName = mapping.value.split("[.]")(1)
          val pages: List[Repository] = {
            Await.result(repo.findRepositoriesByNameAndProject(scenario.project.get, pageName), 10 seconds)
          }
          if(pages.isDefinedAt(0)){
            val page = pages(0)
            breakable {
              for(component <- page.rows.getOrElse(List())){
                if(component.name.equals(componentName)){
                  outputMappings = ScenarioRowMapping(id = component.id.getOrElse(mapping.id),
                                                      value = mapping.value,
                                                      pos = mapping.pos) :: outputMappings
                  mappingUpdate = true
                  break
                }
              }
            }
          }else{
            //Log something
          }
        }
        if(!mappingUpdate){
          outputMappings = mapping :: outputMappings
        }
      }
      outputRows = ScenarioRows(patterns = row.patterns, kind = row.kind, mappings = Some(outputMappings)) :: outputRows
    }
    val jsonRowsAsString = Json.stringify(Json.toJson(outputRows.reverse))
    Scenario(_id = scenario._id, name= scenario.name,
      `type` = scenario.`type`,
      driver = scenario.driver,
      rows = Some(jsonRowsAsString),
      parent= scenario.parent, project = scenario.project)
  }

  def refactorScenario(scenario: Scenario, config: Repository):  Scenario = {
    val scenarioRows = convertJsonToScenarioRows(scenario)
    var outputRows = List[ScenarioRows]()
    for(row <- scenarioRows){
      var outputMappings = List[ScenarioRowMapping]()
      for(mapping <- row.mappings.getOrElse(List())){
        for(configElement <- config.rows.getOrElse(List())){
          if (mapping.id.equals(configElement.id.get)) {
            val newMappingValue = config.name + "." + configElement.name
            outputMappings = ScenarioRowMapping(id = mapping.id, value = newMappingValue, pos = mapping.pos) :: outputMappings
          } else {
            outputMappings = mapping :: outputMappings
          }
        }
      }
      outputRows = outputRows :+ ScenarioRows(patterns = row.patterns, kind = row.kind, mappings = Some(outputMappings))

    }
    val jsonRowsAsString = Json.stringify(Json.toJson(outputRows))
    Scenario(_id = scenario._id,
      name= scenario.name,
      `type` = scenario.`type`,
      driver = scenario.driver,
      rows = Some(jsonRowsAsString),
      parent= scenario.parent,
      project = scenario.project)
  }

  def refactorScenarii(config: Repository) {

    if(config.id != null){
      // BIG OPERATION !! to improve, for instance open a new future
      // and consume the database as a stream
      val query = BSONDocument()
      val scenariiFuture = collection.find(query).cursor[Scenario]().collect[List]()
      scenariiFuture.map{
        scenarii => {
          for {
            scenario <- scenarii
            if isScenarioPatternImpacted(scenario, config)
          } yield upsertScenario(refactorScenario(scenario, config))
        }
      }
    }
  }


  def isScenarioPatternImpacted(scenario: Scenario, config: Repository) : Boolean = {
    var isImpacted = false
    if(scenario.rows != null){
      try{
        val scenarioRows = Json.parse(scenario.rows.getOrElse("[]")).as[List[ScenarioRows]]
        for(row <- scenarioRows; mapping <- row.mappings.getOrElse(List())){
          for(configElement <- config.rows.getOrElse(List())){
            if (mapping.id.equals(configElement.id.get)){
              isImpacted = true
            }
          }
        }
      } catch {
        case e: Exception => {
          println("Couldn't parse scenario rows !")
          e.printStackTrace()
        }
      }
    }
    isImpacted
  }


  private def convertJsonToScenarioRows(scenario: Scenario): List[ScenarioRows] = {
    val scenarioRows = Json.parse(scenario.rows.getOrElse("")).as[List[ScenarioRows]]
    scenarioRows
  }
}
