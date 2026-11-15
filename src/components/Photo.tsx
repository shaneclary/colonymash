import type { PhotoSlot } from "@/content/photos";
import { site } from "@/content/site";
import { Confirm } from "./Confirm";

/**
 * A photo, or the brief for one that has not been taken yet.
 * Place, people and beer are shown in black and white. Seltzer is shown in color.
 * An empty slot shows its brief on the staging site and nothing at all once the site is live.
 */
export function Photo({ slot, caption, eager = false }: { slot: PhotoSlot; caption?: string; eager?: boolean }) {
  const shape = slot.shape === "portrait" ? "" : ` cm-photo--${slot.shape}`;

  if (slot.src) {
    const needsRightsCheck = site.reviewMode && slot.rightsConfirmed === false;
    return (
      <figure className={`cm-photo${shape}${slot.treatment === "bw" ? " cm-photo--bw" : ""}`}>
        <div className="cm-photo__frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.src} width={slot.width} height={slot.height} alt={slot.alt ?? ""} loading={eager ? "eager" : "lazy"} decoding="async" />
        </div>
        {caption || needsRightsCheck ? (
          <figcaption className="cm-photo__caption cm-small">
            <span>{caption}</span>
            {needsRightsCheck ? <Confirm id="photos" /> : null}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (!site.reviewMode) return null;
  return (
    <figure className={`cm-photo${shape}`}>
      <div className="cm-photo__frame cm-photo__frame--empty">
        <div className="cm-photo__slot">
          <span className="cm-label">
            Photo {slot.id} · {slot.treatment === "bw" ? "black and white" : "color"}
          </span>
          <span className="cm-body-strong">{slot.title}</span>
          <span className="cm-small">{slot.brief}</span>
        </div>
      </div>
    </figure>
  );
}
