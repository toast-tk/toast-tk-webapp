
import scala.reflect.runtime.{universe => ru}
import scala.reflect.runtime.universe._

import controllers.Application

val mirror = ru.runtimeMirror(getClass.getClassLoader)
val clazz = Class.forName("controllers.Application")
val reflectedType = mirror.classSymbol(clazz).toType

val method = reflectedType.member(TermName("trim"))