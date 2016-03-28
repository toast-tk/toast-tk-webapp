import scala.collection.mutable
import scala.util.matching.Regex

println("blah")
val input = "Type {{value:string}} in";
val splittedPattern = input.split("\\s+")
val regex = """\{\{([\.\w:]+)\}\}""".r
splittedPattern.foreach { word =>
  word match {
    case regex(word) =>
      println (word)
    case x =>
      println ("not word: " + x)
  }
}


val a = mutable.Stack[String]()
a.push("Sal");


