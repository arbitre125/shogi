package lila.relay

import chess.format.pgn.Tags
import lila.study.{ Chapter, Node, PgnImport }

case class RelayGame(
    index: Int,
    tags: Tags,
    variant: chess.variant.Variant,
    root: Node.Root,
    end: Option[PgnImport.End]
) {

  def staticTagsMatch(chapterTags: Tags): Boolean =
    RelayGame.staticTags forall { name =>
      chapterTags(name) == tags(name)
    }
  def staticTagsMatch(chapter: Chapter): Boolean = staticTagsMatch(chapter.tags)

  def started = root.children.nodes.nonEmpty

  def finished = end.isDefined

  def isEmpty = tags.value.isEmpty && root.children.nodes.isEmpty

  lazy val looksLikeLishogi = tags(_.Site) exists { site =>
    RelayGame.lishogiDomains exists { domain =>
      site startsWith s"https://$domain/"
    }
  }
}

private object RelayGame {

  val lishogiDomains = List("lishogi.org", "lishogi.dev")

  val staticTags = List("white", "black", "round", "event", "site")
}
