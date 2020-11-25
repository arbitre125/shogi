import { h } from "snabbdom";
import { Shogiground } from "shogiground";
import * as cg from "shogiground/types";
import { Api as CgApi } from "shogiground/api";
import { Config } from "shogiground/config";
import changeColorHandle from "common/coordsColor";
import resizeHandle from "common/resize";
import * as util from "./util";
import { plyStep } from "./round";
import RoundController from "./ctrl";
import { RoundData } from "./interfaces";
import { promotesTo } from "shogiutil/util";

export function makeConfig(ctrl: RoundController): Config {
  const data = ctrl.data,
    hooks = ctrl.makeCgHooks(),
    step = plyStep(data, ctrl.ply),
    playing = ctrl.isPlaying();
  return {
    fen: step.fen,
    orientation: boardOrientation(data, ctrl.flip),
    turnColor: step.ply % 2 === 0 ? "white" : "black",
    lastMove: util.uci2move(step.uci),
    check: !!step.check,
    coordinates: data.pref.coords !== 0,
    addPieceZIndex: ctrl.data.pref.is3d,
    highlight: {
      lastMove: data.pref.highlight,
      check: data.pref.highlight,
    },
    events: {
      move: hooks.onMove,
      dropNewPiece: hooks.onNewPiece,
      insert(elements) {
        resizeHandle(elements, ctrl.data.pref.resizeHandle, ctrl.ply);
        if (data.pref.coords == 1) changeColorHandle();
      },
    },
    movable: {
      free: false,
      color: playing ? data.player.color : undefined,
      dests: playing ? util.parsePossibleMoves(data.possibleMoves) : new Map(),
      showDests: data.pref.destination,
      rookCastle: data.pref.rookCastle,
      events: {
        after: hooks.onUserMove,
        afterNewPiece: hooks.onUserNewPiece,
      },
    },
    animation: {
      enabled: true,
      duration: data.pref.animationDuration,
    },
    premovable: {
      enabled: data.pref.enablePremove,
      showDests: data.pref.destination,
      castle: false,
      events: {
        set: hooks.onPremove,
        unset: hooks.onCancelPremove,
      },
    },
    predroppable: {
      enabled: data.pref.enablePremove,
      events: {
        set: hooks.onPredrop,
        unset() {
          hooks.onPredrop(undefined);
        },
      },
    },
    draggable: {
      enabled: data.pref.moveEvent > 0,
      showGhost: data.pref.highlight,
    },
    selectable: {
      enabled: data.pref.moveEvent !== 1,
    },
    drawable: {
      enabled: true,
    },
    disableContextMenu: true,
  };
}

export function reload(ctrl: RoundController) {
  ctrl.shogiground.set(makeConfig(ctrl));
}

export function promote(ground: CgApi, key: cg.Key) {
  const piece = ground.state.pieces.get(key);
  if (piece && !piece.promoted) {
    const prole = promotesTo(piece.role);
    ground.setPieces(
      new Map([
        [
          key,
          {
            color: piece.color,
            role: prole,
            promoted: true,
          },
        ],
      ])
    );
  }
}

export function boardOrientation(data: RoundData, flip: boolean): Color {
  if (data.game.variant.key === "racingKings") return flip ? "black" : "white";
  else return flip ? data.opponent.color : data.player.color;
}

export function render(ctrl: RoundController) {
  return h("div.cg-wrap", {
    hook: util.onInsert((el) =>
      ctrl.setShogiground(Shogiground(el, makeConfig(ctrl)))
    ),
  });
}
