import { useEffect, useRef, useState } from "react";
import {
  badges,
  forecast,
  IDEAS,
  initialPlan,
  initialStudio,
  playWeek,
  STARTING_CASH,
  WEEKS,
  ROOMS,
} from "./engine";
import { StudioScene } from "./StudioScene";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${money(Math.abs(n))}`;
declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
export default function Game() {
  const [studio, setStudio] = useState(() => initialStudio());
  const [plan, setPlan] = useState(initialPlan);
  const [phase, setPhase] = useState<"intro" | "plan" | "reveal" | "finish">(
    "intro",
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const lock = useRef(false);
  const last = studio.history[studio.history.length - 1];
  const preview = studio.week < WEEKS.length ? forecast(studio, plan) : last!;
  const visible = phase === "reveal" || phase === "finish" ? last! : preview;
  const earned = badges(studio);
  const room = ROOMS.find((r) => r.id === studio.room)!;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    heading.current?.focus();
    lock.current = false;
  }, [phase]);
  useEffect(() => {
    window.render_game_to_text = () =>
      JSON.stringify({
        phase,
        week: studio.week + (phase === "plan" ? 1 : 0),
        cash: studio.cash,
        room: studio.room,
        recurringVisitsAdded: studio.growth,
        plan,
        result: last ?? null,
        forecast: preview,
        badges: earned,
        coordinates:
          "Decorative canvas: origin top left; x right, y down. Use HTML buttons to play.",
      });
    // Turns are event-driven; advancing clock time never commits a decision.
    window.advanceTime = () => {};
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [phase, studio, plan, preview, earned, last]);
  function commit() {
    if (lock.current || phase !== "plan") return;
    lock.current = true;
    setStudio(playWeek(studio, plan));
    setPhase("reveal");
  }
  function restart() {
    setStudio(initialStudio());
    setPlan(initialPlan());
    setPhase("intro");
  }
  return (
    <main className={`game-shell ${reducedMotion ? "still" : ""}`}>
      <header className="game-top">
        <a href="/blog/a-little-room-to-grow/">← Back to the story</a>
        <span className="eyebrow">Tandava journal · Play</span>
      </header>
      <div className="game-title">
        <div>
          <span className="eyebrow">Small choices. Good things.</span>
          <h1>
            Studio Sprout<span className="sprout">✳</span>
          </h1>
        </div>
        <span className="pill">6 weeks · about 5 minutes</span>
      </div>
      {phase === "intro" ? (
        <section className="intro card">
          <div>
            <span className="eyebrow">Your very own little studio</span>
            <h2 ref={heading} tabIndex={-1}>
              Let’s grow something lovely.
            </h2>
            <p>
              You have a sunny room, {money(STARTING_CASH)} in the studio jar,
              and a neighborhood full of possibility.
            </p>
            <p>
              Each week, choose a class schedule, a ticket mix, and one lovely
              idea. See your forecast, open the doors, and discover what grows.
            </p>
            <fieldset className="room-picker">
              <legend>First, choose your little room</legend>
              {ROOMS.map((r) => (
                <button
                  key={r.id}
                  aria-pressed={studio.room === r.id}
                  onClick={() => setStudio(initialStudio(r.id))}
                >
                  <strong>{r.name}</strong>
                  <small>
                    {r.mats} mats · {money(r.fixed)} weekly rent & overhead
                  </small>
                </button>
              ))}
            </fieldset>
            <div className="goal-note">
              Your challenge: collect three garden badges while paying yourself
              $300 a week. No timer. Every season is a fresh experiment.
            </div>
            <button
              className="primary"
              id="start-btn"
              onClick={() => setPhase("plan")}
            >
              Plant the first seed <span>↗</span>
            </button>
            <small>
              Fictional dollars and simplified economics. No account needed.
              Progress lasts until you close or refresh this page.
            </small>
          </div>
          <div className="intro-scene">
            <StudioScene
              occupancy={0.65}
              week={0}
              reducedMotion={reducedMotion}
            />
            <span className="scene-caption">
              A little space. A lot of possibility.
            </span>
          </div>
        </section>
      ) : (
        <>
          <ol className="week-track" aria-label="Season progress">
            {WEEKS.map((_, i) => (
              <li
                key={i}
                className={
                  i < studio.week
                    ? "complete"
                    : i === studio.week
                      ? "current"
                      : ""
                }
                aria-current={
                  phase === "plan" && i === studio.week ? "step" : undefined
                }
              >
                <span>{i < studio.week ? "✓" : i + 1}</span>
                <small>Week {i + 1}</small>
              </li>
            ))}
          </ol>
          <div className="play-grid">
            <section className="studio-column">
              <div className="scene card">
                <div className="scene-label">
                  <span>{room.name.toUpperCase()}</span>
                  <span>
                    {phase === "plan"
                      ? "Your forecast"
                      : "Your season, growing"}
                  </span>
                </div>
                <StudioScene
                  occupancy={visible.occupancy}
                  week={studio.week}
                  reducedMotion={reducedMotion}
                />
                <div className="scene-caption">
                  {Math.round(visible.occupancy * 100)}% of class spaces filled
                  · {visible.visits} visits{phase === "plan" ? " expected" : ""}
                </div>
              </div>
              <div className="stats">
                <div>
                  <span>Studio jar</span>
                  <strong>{money(studio.cash)}</strong>
                </div>
                <div>
                  <span>Owner pay to date</span>
                  <strong>{money(studio.week * 300)}</strong>
                </div>
                <div>
                  <span>Returning visits added</span>
                  <strong>
                    +{studio.growth}
                    <small> / week</small>
                  </strong>
                </div>
              </div>
              <div className="badge-list">
                {earned.map((b) => (
                  <div
                    className={b.earned ? "badge earned" : "badge"}
                    key={b.name}
                  >
                    <span aria-hidden="true">{b.earned ? "✿" : "♧"}</span>
                    <div>
                      <strong>
                        {b.name} {b.earned ? "✓" : ""}
                      </strong>
                      <small>{b.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
              <details className="model">
                <summary>The little model under the hood</summary>
                <p>
                  {room.mats} spaces per class. $55 teacher pay per class.{" "}
                  {money(room.fixed)} weekly rent and overhead. $300 weekly
                  owner pay. No taxes, debt, or payment fees modeled.
                </p>
                <p>
                  Visits = 108 + recurring growth + this week’s event +
                  initiative visits + ticket-mix adjustment. A $14 average adds
                  20 visits; $22 subtracts 20. Attendance stops at capacity.
                  These are invented teaching assumptions, not real demand
                  estimates.
                </p>
                <p>
                  Ticket mix is average realized income per visit across passes
                  and drop-ins. Workshop income and costs are separate.
                  Recurring growth starts the following week. Every forecast is
                  exact in this game; real studios have uncertainty.
                </p>
              </details>
            </section>
            <section className="decision card" aria-label="Weekly decisions">
              {phase === "plan" ? (
                <>
                  <span className="eyebrow">
                    Week {studio.week + 1} of 6 · Make a little plan
                  </span>
                  <h2 tabIndex={-1} ref={heading}>
                    {WEEKS[studio.week].title}
                  </h2>
                  <p className="event-note">{WEEKS[studio.week].note}</p>
                  <fieldset>
                    <legend>1. Find your class rhythm</legend>
                    <div className="segments">
                      {[8, 10, 12, 14, 16].map((n) => (
                        <button
                          key={n}
                          aria-pressed={plan.classes === n}
                          onClick={() => setPlan((p) => ({ ...p, classes: n }))}
                        >
                          {n}
                          <small>classes</small>
                        </button>
                      ))}
                    </div>
                    <small>
                      {room.mats} mats per class · {money(plan.classes * 55)} in
                      teacher pay
                    </small>
                  </fieldset>
                  <fieldset>
                    <legend>2. Choose your ticket mix</legend>
                    <div className="segments">
                      {[14, 18, 22].map((n, i) => (
                        <button
                          key={n}
                          aria-pressed={plan.yield === n}
                          onClick={() => setPlan((p) => ({ ...p, yield: n }))}
                        >
                          {money(n)}
                          <small>
                            {
                              [
                                "More accessible",
                                "A happy middle",
                                "More per visit",
                              ][i]
                            }
                          </small>
                        </button>
                      ))}
                    </div>
                    <small>
                      Average income per visit, across passes and drop-ins.
                    </small>
                  </fieldset>
                  <fieldset>
                    <legend>3. Add one lovely idea</legend>
                    <div className="ideas">
                      {IDEAS.map((idea) => (
                        <button
                          className="idea"
                          key={idea.id}
                          aria-pressed={plan.idea === idea.id}
                          onClick={() =>
                            setPlan((p) => ({ ...p, idea: idea.id }))
                          }
                        >
                          <span className="idea-icon" aria-hidden="true">
                            {idea.icon}
                          </span>
                          <span>
                            <strong>{idea.name}</strong>
                            <small>{idea.description}</small>
                            <span className="idea-effect">
                              {money(idea.cost)} cost ·{" "}
                              {idea.extraRevenue
                                ? `${money(idea.extraRevenue)} workshop income`
                                : `+${idea.visits} visits now`}{" "}
                              · +{idea.growth} visits each later week
                            </span>
                          </span>
                          <span aria-hidden="true">
                            {plan.idea === idea.id ? "●" : "○"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="forecast" aria-live="polite">
                    <span>
                      <strong>This week’s forecast</strong>
                      <small>After costs and your $300 pay</small>
                    </span>
                    <strong>{signed(preview.net)}</strong>
                  </div>
                  <p className="forecast-tip">
                    {preview.demand > preview.capacity
                      ? `${preview.demand - preview.capacity} visits need more space. Try adding classes and compare the forecast.`
                      : preview.breakEvenVisits > preview.capacity
                        ? "This mix needs more visits than the room can hold. Try a different mix or idea."
                        : `${preview.breakEvenVisits} visits cover this week’s costs. You’re expecting ${preview.visits}.`}
                  </p>
                  <button className="primary" onClick={commit}>
                    Open the doors <span>↗</span>
                  </button>
                </>
              ) : phase === "reveal" ? (
                <div className="reveal">
                  <span className="eyebrow">
                    Week {studio.week} · Look what you grew
                  </span>
                  <h2 tabIndex={-1} ref={heading}>
                    {last!.net >= 0
                      ? "A little more room to bloom."
                      : "A week of planting seeds."}
                  </h2>
                  <div className="result-number">{signed(last!.net)}</div>
                  <p>
                    {last!.net >= 0
                      ? "Added to your studio jar, with teacher pay and your own pay already covered. Lovely."
                      : "An investment from your studio jar. Your teachers and you were paid. Now you have a new idea to try."}
                  </p>
                  <dl className="ledger">
                    <div>
                      <dt>
                        {last!.visits} visits × {money(last!.plan.yield)}
                      </dt>
                      <dd>{money(last!.classRevenue)}</dd>
                    </div>
                    <div>
                      <dt>Workshop income</dt>
                      <dd>{money(last!.extraRevenue)}</dd>
                    </div>
                    <div>
                      <dt>Rent & overhead</dt>
                      <dd>−{money(last!.fixed)}</dd>
                    </div>
                    <div>
                      <dt>Teacher pay</dt>
                      <dd>−{money(last!.teaching)}</dd>
                    </div>
                    <div>
                      <dt>Your pay</dt>
                      <dd>−{money(last!.ownerPay)}</dd>
                    </div>
                    <div>
                      <dt>Your lovely idea</dt>
                      <dd>−{money(last!.initiative)}</dd>
                    </div>
                    <div className="ledger-total">
                      <dt>Change in your studio jar</dt>
                      <dd>{signed(last!.net)}</dd>
                    </div>
                  </dl>
                  <div className="lesson">
                    <span>✧ A little discovery</span>
                    <p>{IDEAS.find((i) => i.id === last!.plan.idea)!.lesson}</p>
                    {last!.demand > last!.capacity && (
                      <p>
                        Your room was full! {last!.demand - last!.capacity}{" "}
                        additional visits couldn’t fit this week. Compare a
                        bigger schedule next time.
                      </p>
                    )}
                  </div>
                  {studio.cash < 0 && (
                    <p className="goal-note">
                      Your jar needs {money(-studio.cash)} of extra funding. In
                      this sandbox you can keep exploring; try fewer classes or
                      a different ticket mix.
                    </p>
                  )}
                  <button
                    className="primary"
                    onClick={() =>
                      setPhase(studio.week === 6 ? "finish" : "plan")
                    }
                  >
                    {studio.week === 6
                      ? "See your little garden"
                      : `Let’s grow week ${studio.week + 1}`}{" "}
                    <span>↗</span>
                  </button>
                </div>
              ) : (
                <div className="finish">
                  <span className="eyebrow">
                    Six weeks. Your own kind of growth.
                  </span>
                  <div className="flower" aria-hidden="true">
                    ✿
                  </div>
                  <h2 tabIndex={-1} ref={heading}>
                    {earned.every((b) => b.earned)
                      ? "Look at you bloom."
                      : "Good things start small."}
                  </h2>
                  <p>
                    You earned {earned.filter((b) => b.earned).length} of 3
                    garden badges, welcomed{" "}
                    {studio.history.reduce((n, r) => n + r.visits, 0)} visits,
                    and paid yourself {money(studio.week * 300)}.
                  </p>
                  <div className="goal-note">
                    {studio.cash >= STARTING_CASH
                      ? `Your studio jar grew by ${money(studio.cash - STARTING_CASH)}. That’s breathing room for what comes next.`
                      : `You used ${money(STARTING_CASH - studio.cash)} of runway to explore your ideas.${studio.cash < 0 ? ` That includes ${money(-studio.cash)} of extra funding needed.` : ""} Try another season and see what a different rhythm does.`}
                  </div>
                  <p>
                    Try the same plan with another room next time. The lease
                    changes every week’s costs; more capacity helps only when
                    the visits fill it.
                  </p>
                  <h3>Your next experiment</h3>
                  <p>
                    {studio.growth < 30
                      ? "Try building a returning-visitor ritual early. Can those extra visits help your later weeks?"
                      : "Try keeping your ideas but changing the class schedule. How much space does your neighborhood really need?"}
                  </p>
                  <details>
                    <summary>Your six-week scrapbook</summary>
                    <div className="scrapbook">
                      {studio.history.map((r) => (
                        <p key={r.week}>
                          <strong>
                            Week {r.week + 1}: {signed(r.net)}
                          </strong>
                          <br />
                          {r.plan.classes} classes · {r.visits} visits ·{" "}
                          {money(r.plan.yield)} per visit
                        </p>
                      ))}
                    </div>
                  </details>
                  <button className="primary" onClick={restart}>
                    Grow another little studio <span>↻</span>
                  </button>
                  <a className="text-link" href="/blog/a-little-room-to-grow/">
                    Back to the story →
                  </a>
                </div>
              )}
            </section>
          </div>
        </>
      )}
      <footer className="game-footer">
        <span>A playful learning model, made for the journal.</span>
        <button
          aria-pressed={reducedMotion}
          onClick={() => setReducedMotion((v) => !v)}
        >
          {reducedMotion ? "Motion off" : "Motion on"}
        </button>
      </footer>
    </main>
  );
}
