"use client";
import { useState } from "react";
import { Confirm } from "@/components/Confirm";
const items = [
  { id: "new", label: "New releases", detail: "Be first to hear about the next flavor." },
  { id: "returns", label: "Back on tap", detail: "Know when your favorites return." },
  { id: "taproom", label: "Taproom news", detail: "Hours and special happenings." },
] as const;
export function UpdatesPreview() {
  const [selected, setSelected] = useState<string[]>(["new","returns"]);
  return <div className="cm-stack cm-stack--lg cm-stack--fill cm-measure">
    <span className="cm-inline"><span className="cm-tag cm-tag--dashed cm-label">Preview only</span><Confirm id="sms-consent" /></span>
    <h2 className="cm-sign-lg">Your updates, your choice.</h2>
    <p className="cm-body">Choose the kinds of updates you would like. SMS registration is not active until the brewery confirms age verification, messaging compliance, and a provider.</p>
    <fieldset className="cm-stack cm-stack--fill cm-update-fieldset">
      <legend className="cm-body-strong">I'm interested in</legend>
      {items.map((item) => <label className="cm-update-option" key={item.id}>
        <input type="checkbox" checked={selected.includes(item.id)}
          onChange={(event) => setSelected((current) => event.target.checked ? [...current,item.id] : current.filter((id) => id !== item.id))} />
        <span><strong className="cm-body-strong">{item.label}</strong><span className="cm-small cm-soft">{item.detail}</span></span>
      </label>)}
    </fieldset>
    <button className="cm-btn cm-body-strong" type="button" disabled>SMS enrollment pending approval</button>
    <p className="cm-small cm-soft">No phone number, consent record, or subscription is collected or stored on this page yet.</p>
  </div>;
}
