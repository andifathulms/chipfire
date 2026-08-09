import { WEIGHTS, explainScores } from "@/lib/ai/evaluate";
import type { GameState } from "@/lib/engine/state";
import type { Locale } from "@/lib/i18n";
import { playerName, styleFor } from "@/lib/players";

/**
 * What the evaluation function says about the position on screen.
 *
 * PRD §8 promises an AI that is hand-written and fully inspectable, with no
 * hidden information and no cheating — and that promise was only checkable by
 * reading the source. This is the same arithmetic the search runs on, shown
 * term by term, so the claim can be verified rather than believed.
 *
 * Two things it is careful not to be.
 *
 * It is not an explanation of the move the AI played. The search looks several
 * plies ahead; this is a static reading of the current position, and reporting
 * it as a reason would be inventing a justification the machine never used.
 *
 * It is not a recommendation. It scores the position in front of you, not the
 * moves available from it — the difference between a readout and an oracle, and
 * the same line the cascade preview sits on. Folded away by default so it is
 * something you go and look at rather than something that coaches you.
 */
const COPY = {
  title: { id: "Penilaian AI", en: "The AI's evaluation" },
  lede: {
    id: "Penilaian statis atas posisi di layar, bukan alasan langkah yang barusan dimainkan — pencarian melihat beberapa langkah ke depan. Bobotnya bilangan bulat dan tetap.",
    en: "A static reading of the position on screen, not the reason for the move just played — the search looks several plies ahead. The weights are fixed integers.",
  },
  orbs: { id: "Orb", en: "Orbs" },
  cells: { id: "Sel", en: "Cells" },
  position: { id: "Posisi", en: "Position" },
  vulnerability: { id: "Rawan", en: "Exposed" },
  total: { id: "Total", en: "Total" },
  weights: { id: "Bobot", en: "Weights" },
  fair: {
    id: "AI melihat papan yang sama denganmu. Tidak ada yang disembunyikan.",
    en: "The AI sees the same board you do. Nothing here is hidden from you.",
  },
} as const;

const CELL = "px-2 py-1 text-right font-numeral tabular-nums";

export function EvaluationPanel({
  state,
  locale,
}: {
  state: GameState;
  locale: Locale;
}) {
  const terms = explainScores(state);

  return (
    <div className="flex flex-col gap-xs text-sm">
      <p className="max-w-measure text-xs text-trace-faint">
        {COPY.lede[locale]}
      </p>

      {/*
       * The table scrolls, not the document. A row header plus up to four
       * player columns does not fit 320px, and without this the overflow is
       * pushed onto the page, which is the one thing reflow rules out.
       */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-xs">
          <thead>
            <tr className="border-b border-trace-hairline">
              {/* The corner cell heads a column of row names, so it has no
                title of its own — but an empty <th> announces as an unnamed
                header. A presentational <td> is what an empty corner is. */}
              <td />
              {terms.map((_, player) => (
                <th key={player} scope="col" className={`${CELL} font-normal`}>
                  {/* Colour plus name, never colour alone. */}
                  <span className={styleFor(player).ink}>
                    {playerName(player, locale)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-trace-soft">
            {(["orbs", "cells", "position", "vulnerability"] as const).map(
              (term) => (
                <tr key={term} className="border-b border-trace-hairline">
                  <th scope="row" className="px-2 py-1 text-left font-normal">
                    {COPY[term][locale]}
                  </th>
                  {terms.map((player, index) => (
                    <td key={index} className={CELL}>
                      {player[term]}
                    </td>
                  ))}
                </tr>
              ),
            )}
            <tr className="border-b border-trace-hairline text-trace">
              <th scope="row" className="px-2 py-1 text-left font-medium">
                {COPY.total[locale]}
              </th>
              {terms.map((player, index) => (
                <td key={index} className={`${CELL} font-medium`}>
                  {player.total}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* The weights themselves, because a table of numbers whose coefficients
          are hidden is not more inspectable than no table at all. */}
      <p className="font-mono text-xs text-trace-faint">
        {COPY.weights[locale]}: orb {WEIGHTS.orb} · cell {WEIGHTS.cell} ·
        position {WEIGHTS.position}×(5−mass) · vulnerability −
        {WEIGHTS.vulnerability}
      </p>

      <p className="max-w-measure text-xs text-trace-faint">
        {COPY.fair[locale]}
      </p>
    </div>
  );
}
