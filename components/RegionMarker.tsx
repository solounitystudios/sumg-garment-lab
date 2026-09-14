"use client";

import { useRef, useState } from "react";
import { CandidateRegionType } from "@/types/domain";
import styles from "./RegionMarker.module.css";

type Point = { x: number; y: number };
type NormalizedRect = { x: number; y: number; width: number; height: number };

const MIN_DRAG_PX = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function RegionMarker({
  sourceId,
  analysisId,
  imageUrl,
  imageAlt,
  regionCount,
  createRegionAction,
}: {
  sourceId: string;
  analysisId: string;
  imageUrl: string;
  imageAlt: string;
  regionCount: number;
  createRegionAction: (formData: FormData) => Promise<void>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);
  const [draft, setDraft] = useState<NormalizedRect | null>(null);
  const [regionType, setRegionType] = useState<string>(CandidateRegionType.UNKNOWN);
  const [label, setLabel] = useState("");
  const [syncedRegionCount, setSyncedRegionCount] = useState(regionCount);

  // The parent's region list changes shape once the server confirms a new
  // region was saved (revalidatePath). Use that as the signal to clear the
  // just-submitted draft, adjusted during render per React's guidance for
  // resetting state when a prop changes (no effect needed).
  if (regionCount !== syncedRegionCount) {
    setSyncedRegionCount(regionCount);
    setDraft(null);
    setLabel("");
    setRegionType(CandidateRegionType.UNKNOWN);
  }

  function pointFromEvent(event: React.PointerEvent<HTMLDivElement>): Point | null {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (draft) return;
    const point = pointFromEvent(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart(point);
    setDragCurrent(point);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;
    const point = pointFromEvent(event);
    if (point) setDragCurrent(point);
  }

  function handlePointerUp() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!dragStart || !dragCurrent || !rect) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const left = Math.min(dragStart.x, dragCurrent.x);
    const top = Math.min(dragStart.y, dragCurrent.y);
    const width = Math.abs(dragCurrent.x - dragStart.x);
    const height = Math.abs(dragCurrent.y - dragStart.y);

    setDragStart(null);
    setDragCurrent(null);

    if (width < MIN_DRAG_PX || height < MIN_DRAG_PX) return;

    setDraft({
      x: left / rect.width,
      y: top / rect.height,
      width: width / rect.width,
      height: height / rect.height,
    });
  }

  const liveRect =
    dragStart && dragCurrent
      ? {
          left: Math.min(dragStart.x, dragCurrent.x),
          top: Math.min(dragStart.y, dragCurrent.y),
          width: Math.abs(dragCurrent.x - dragStart.x),
          height: Math.abs(dragCurrent.y - dragStart.y),
        }
      : null;

  return (
    <div>
      <div
        ref={wrapperRef}
        className={styles.canvasWrapper}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not an optimizable static asset */}
        <img className={styles.image} src={imageUrl} alt={imageAlt} draggable={false} />

        {liveRect && (
          <div
            className={styles.dragRect}
            style={{
              left: liveRect.left,
              top: liveRect.top,
              width: liveRect.width,
              height: liveRect.height,
            }}
          />
        )}

        {draft && (
          <div
            className={styles.draftRect}
            style={{
              left: `${draft.x * 100}%`,
              top: `${draft.y * 100}%`,
              width: `${draft.width * 100}%`,
              height: `${draft.height * 100}%`,
            }}
          />
        )}
      </div>

      <p className={styles.hint}>
        Drag on the image to mark a region, then choose its type and save.
      </p>

      {draft && (
        <form action={createRegionAction} className={styles.draftForm}>
          <input type="hidden" name="sourceId" value={sourceId} />
          <input type="hidden" name="analysisId" value={analysisId} />
          <input type="hidden" name="x" value={draft.x} />
          <input type="hidden" name="y" value={draft.y} />
          <input type="hidden" name="width" value={draft.width} />
          <input type="hidden" name="height" value={draft.height} />

          <div className={styles.draftFormField}>
            <label className={styles.draftFormLabel} htmlFor="regionType">
              Type
            </label>
            <select
              id="regionType"
              name="regionType"
              className={styles.select}
              value={regionType}
              onChange={(event) => setRegionType(event.target.value)}
            >
              {Object.values(CandidateRegionType).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.draftFormField}>
            <label className={styles.draftFormLabel} htmlFor="label">
              Label (optional)
            </label>
            <input
              id="label"
              name="label"
              className={styles.textInput}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={80}
            />
          </div>

          <button className={styles.saveButton} type="submit">
            Save Region
          </button>
          <button
            className={styles.cancelButton}
            type="button"
            onClick={() => setDraft(null)}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
