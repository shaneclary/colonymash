"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortalRole } from "@/content/portal-demo";
import { tourCopy, tours, type TourStep } from "@/content/portal-tour";
import { readTour, tourBack, tourClose, tourGoTo, tourNext, tourRestart, type TourState } from "@/lib/portal-tour";

const storageKey = (role: PortalRole) => "cm-portal-tour-" + role + "-v1";

/** The walkthrough's state for one portal, remembered in this browser. Null until it has loaded. */
export function usePortalTour(role: PortalRole, mode: "demo" | "live" | null = "demo") {
  const steps = tours[role];
  const [tour, setTour] = useState<TourState | null>(null);
  useEffect(() => {
    if (mode === null) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem(storageKey(role) + (mode === "live" ? "-live" : "")); } catch { /* storage blocked: tour still runs */ }
    // The walkthrough is written around the sample data, so a live session does not open it unasked.
    setTour(raw || mode === "demo" ? readTour(raw, steps.length) : { status: "closed", step: 0 });
  }, [role, steps.length, mode]);
  const update = useCallback((next: TourState) => {
    setTour(next);
    try { localStorage.setItem(storageKey(role) + (mode === "live" ? "-live" : ""), JSON.stringify(next)); } catch { /* not remembered */ }
  }, [role, mode]);
  return {
    tour, steps,
    next: () => tour && update(tourNext(tour, steps.length)),
    back: () => tour && update(tourBack(tour)),
    close: () => tour && update(tourClose(tour)),
    restart: () => update(tourRestart()),
    goTo: (step: number) => update(tourGoTo(step, steps.length)),
  };
}
export type PortalTour = ReturnType<typeof usePortalTour>;

/**
 * The step card. It opens the step's screen, scrolls to the part it is about and outlines it.
 * The X closes it. Help brings it back.
 */
export function TourCard({ controller, onGo, lifted = false }: {
  controller: PortalTour; onGo: (view: string) => void; lifted?: boolean;
}) {
  const { tour, steps } = controller;
  const open = tour?.status === "active";
  const step: TourStep | undefined = open ? steps[tour.step] : undefined;
  const stepId = step?.id;
  useEffect(() => {
    if (!step) return;
    onGo(step.view);
    let marked: Element | null = null;
    // Wait for the screen to switch before looking for the part to point at.
    const timer = window.setTimeout(() => {
      marked = step.target ? document.querySelector('[data-tour="' + step.target + '"]') : null;
      if (!marked) return;
      marked.setAttribute("data-tour-on", "");
      marked.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }, 80);
    return () => { window.clearTimeout(timer); marked?.removeAttribute("data-tour-on"); };
    // Runs when the step changes, not on every render of the portal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);
  if (!open || !step || !tour) return null;
  const last = tour.step === steps.length - 1;
  return <aside className={"cm-portal__tour" + (lifted ? " cm-portal__tour--lifted" : "")} aria-label={tourCopy.kicker}>
    <div className="cm-portal__tour-top">
      <span>{tourCopy.kicker} · {tour.step + 1} of {steps.length}</span>
      <button type="button" onClick={controller.close} aria-label={tourCopy.close}>×</button>
    </div>
    <div aria-live="polite">
      <strong>{step.title}</strong>
      <p>{step.body}</p>
      {step.tryIt && <p className="cm-portal__tour-try"><b>{tourCopy.tryIt}</b> {step.tryIt}</p>}
    </div>
    <div className="cm-portal__tour-actions">
      <button type="button" onClick={controller.back} disabled={tour.step === 0}>{tourCopy.back}</button>
      <button type="button" className="cm-portal__tour-next" onClick={controller.next}>{last ? tourCopy.finish : tourCopy.next + " →"}</button>
    </div>
  </aside>;
}

/** The "i" button on each screen. Tap to read what the screen is for. */
export function Info({ text }: { text: string }) {
  return <details className="cm-portal__info">
    <summary><span aria-hidden="true">i</span>{tourCopy.infoLabel}</summary>
    <p>{text}</p>
  </details>;
}

/** Help screen: restart the walkthrough, jump to a step, and read every screen's note. */
export function HelpPanel({ controller, tabs, notes, live = false }: {
  controller: PortalTour; tabs: readonly { id: string; label: string }[]; notes: Record<string, string>; live?: boolean;
}) {
  const { tour, steps } = controller;
  return <div className="cm-portal__two" data-tour="help">
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Help</p><h2>Walkthrough</h2></div>
        <span>{tour?.status === "active" ? "On · step " + (tour.step + 1) : tour?.status === "done" ? "Finished" : "Off"}</span></div>
      {tour?.status !== "active" && <p>{tourCopy.closedNote}</p>}
      {live && <p className="cm-portal__muted">{tourCopy.liveNote}</p>}
      <button type="button" className="cm-portal__button cm-portal__button--dark" onClick={controller.restart}>{tourCopy.restart} ↗</button>
      <ol className="cm-portal__help-steps">{steps.map((step, index) => <li key={step.id}>
        <button type="button" className="cm-portal__linkbutton" onClick={() => controller.goTo(index)}>{step.title}</button>
        <span>{step.body}</span>
      </li>)}</ol>
    </section>
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><h2>What each screen is for</h2></div>
      <dl className="cm-portal__help-notes">{tabs.filter(tab => tab.id !== "help").map(tab => <div key={tab.id}>
        <dt>{tab.label}</dt><dd>{notes[tab.id]}</dd></div>)}</dl>
      <p className="cm-portal__muted">{live ? tourCopy.liveDataNote : tourCopy.demoNote}</p>
    </section>
  </div>;
}
