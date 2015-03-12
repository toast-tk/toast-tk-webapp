import scala.io.Source

val source = Source.fromFile("D:\\temp\\PscTestGreenPepper\\src\\main\\resources\\TestFiles\\Web\\web_repository_config.txt")
val lines = source.getLines().filter(line => line.startsWith("|"))
def parselines(acc:List[String], src:List[String]): List[List[String]] = {
  src match {
    case Nil => List(acc)
    case list:List[String] => {
      if(list.head.startsWith("|| auto setup ||")) acc :: parselines(List("|| auto setup ||"), list.tail)
      else parselines( acc ++ List(list.head) , list.tail)
    }
  }
}
val input = lines.toList
source.close()
