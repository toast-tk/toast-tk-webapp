val s = "value"
val b = s.equals("value")

def sentenceChunkReplacement(tagType:String) = {
  tagType match {
    case "Value" => "([\\w\\W]+)"
    case "Variable" => "\\$(\\w+)"
    case "WebPageItem" => "(\\w+).(\\w+)"
    case "SwingComponent" => "(\\w+).(\\w+)"
    case _ => "*Regex undefined for ("+tagType+")*"
  }
}

"""@[[1:value:string]]""".
  replaceAll("""@\[\[\d+:[\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+:([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+)\]\]""", sentenceChunkReplacement("$1"))

