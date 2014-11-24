package controllers

import scala.io.Source

object Importer{

  /*
    "_id" : ObjectId("5465b97c64d72cc9535ad00b"),
    "name" : "LoginPage",
    "type" : "web page",
    "columns" : "[{\"name\":\"name\",\"descriptor\":{}},{\"name\":\"type\",\"descriptor\":{\"type\":[\"button\",\"link\"]}},{\"name\":\"locator\",\"descriptor\":{}},{\"name\":\"method\",\"descriptor\":{\"type\":[\"CSS\",\"XPATH\",\"ID\"]}},{\"name\":\"position\",\"descriptor\":{}}]",
    "rows" : "[{\"name\":\"test\"}]"
  */

  //import configuration from text files
  //import web_page configuration from text files
  def main (args: Array[String]) {
    println("Hello world !")
    val source = Source.fromFile("D:\\temp\\PscTestGreenPepper\\src\\main\\resources\\TestFiles\\Web\\web_repository_config.txt")
    val lines = source.getLines().filter(line => line.startsWith("|"))
    val result = parselines(List(), lines.toList);
    result.mkString("\n")
    source.close()
  }

  def parselines(acc:List[String], src:List[String]): List[List[String]] = {
    src match {
      case Nil => List(acc)
      case x :: xs => {
        if(x.startsWith("|| auto setup ||")) acc :: parselines(List(), xs)
        else parselines(acc, xs)
      }
    }
  }
}