"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { live } from "@/content/site";
import { callRpc } from "@/lib/live-rpc";
import { liveStaffKey } from "../useDemoPortal";

type Member = { id: string; name: string; me: boolean; lastSeen: string | null };

/** Live sessions only: who has a staff key, add someone, turn a key off. */
export function StaffAccess() {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<{ name: string; key: string } | null>(null);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    if (!live) return;
    try {
      const reply = await callRpc(live, "staff_list", { p_key: liveStaffKey() });
      if (reply.ok && Array.isArray(reply.staff)) setMembers(reply.staff as Member[]);
    } catch { setMessage("Could not reach the database."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (!live) return null;
  const config = live;
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const reply = await callRpc(config, "staff_add", { p_key: liveStaffKey(), p_name: name });
      if (reply.ok && typeof reply.key === "string") { setFresh({ name: String(reply.name), key: reply.key }); setName(""); setMessage(""); void load(); }
      else setMessage(reply.reason === "name" ? "Enter their name." : "That did not work. Sign in again and retry.");
    } catch { setMessage("Could not reach the database."); }
  }
  async function remove(member: Member) {
    if (!window.confirm("Turn off " + member.name + "'s key? They will be signed out everywhere.")) return;
    try { await callRpc(config, "staff_remove", { p_key: liveStaffKey(), p_id: member.id }); void load(); }
    catch { setMessage("Could not reach the database."); }
  }
  return <section className="cm-portal__panel">
    <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Staff access</p><h2>Who can sign in</h2></div><span>{members.length} staff</span></div>
    <ul className="cm-portal__bill">{members.map(member => <li key={member.id}>
      <span>{member.name}{member.me ? " (you)" : ""}{member.lastSeen ? " · last seen " + member.lastSeen : " · not signed in yet"}</span>
      {!member.me && <button type="button" className="cm-portal__linkbutton" onClick={() => remove(member)}>Turn off key</button>}
    </li>)}</ul>
    <form className="cm-portal__inline-form" onSubmit={add}>
      <label>Add a staff member<input type="text" required maxLength={60} value={name} placeholder="Their name" onChange={e => setName(e.target.value)}/></label>
      <button type="submit" className="cm-portal__button cm-portal__button--dark">Make their key</button>
    </form>
    {fresh && <div className="cm-portal__feedback" role="status">
      <p>Key for {fresh.name}. It is shown once. Send it to them privately.</p>
      <code className="cm-portal__key">{fresh.key}</code>
      <div className="cm-portal__order-actions">
        <button type="button" className="cm-portal__button" onClick={() => { void navigator.clipboard?.writeText(fresh.key); }}>Copy</button>
        <button type="button" className="cm-portal__button" onClick={() => setFresh(null)}>Done</button>
      </div>
    </div>}
    {message && <p className="cm-portal__error" role="alert">{message}</p>}
    <p className="cm-portal__muted">A key is the whole sign-in. Anyone holding one has full staff access, so each person gets their own and a lost one is turned off here.</p>
  </section>;
}
