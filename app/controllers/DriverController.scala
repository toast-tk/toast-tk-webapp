package controllers

import javax.inject.Inject

import akka.actor.ActorSystem
import play.api.libs.concurrent.Promise
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import akka.pattern.after
import scala.collection.mutable
import scala.concurrent.Future
import scala.concurrent.duration._


object DriverController extends Controller{

  val drivers: mutable.Stack[String] = mutable.Stack[String]();
  val sentences: mutable.Stack[String] = mutable.Stack[String]();

  /**
   * register the front end socket channel to publish
   * incoming sentences to.
   * @return
   */
  def registerFrontWebsocketService =  WebSocket.using[String] {
    request => {
      val out: Enumerator[String] = Enumerator.generateM[String] {
        Promise.timeout({

          val output: Option[String] = sentences match {
            case mutable.Stack(x:String, _*) => {
              val sentence =  sentences.reverse.pop()
              Some(sentence)
            }
            case mutable.Stack() => {
              sentences.push("Nothing received")
              None
            }

          }
          output
        }, 500);
      };

      (Iteratee.ignore[String], out);
    }
  }

  /**
   * Any driver that may push sentences, will be registred here
   *
   * @param host
   * @return
   */
  def subscribeDriver(host: String) = Action {
    request => {
      drivers.push(host);
      sentences.push("Type *val* in *page.item*")
      Ok("driver registred: " + host)
    }
  }

  /**
   * Recorded actions endpoint
   *
   * @return
   */
  def publishRecordedSentence = Action(parse.json) {
    implicit request => {
      sentences.push("Type *val* in *page.recorditem*");
      Ok("sentence processed !")
    }
  }

}
