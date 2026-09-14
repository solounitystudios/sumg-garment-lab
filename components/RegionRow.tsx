"use client";

import { useState } from "react";
import { CandidateRegionType } from "@/types/domain";
import styles from "./RegionRow.module.css";

export default function RegionRow({
  sourceId,
  analysisId,
  region,
  updateRegionAction,
  deleteRegionAction,
}: {
  sourceId: string;
  analysisId: string;
  region: {
    id: string;
    region_type: string;
    label: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  updateRegionAction: (formData: FormData) => Promise<void>;
  deleteRegionAction: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={updateRegionAction}
        className={styles.row}
        onSubmit={() => setEditing(false)}
      >
        <input type="hidden" name="sourceId" value={sourceId} />
        <input type="hidden" name="analysisId" value={analysisId} />
        <input type="hidden" name="regionId" value={region.id} />
        <div className={styles.editForm}>
          <select className={styles.select} name="regionType" defaultValue={region.region_type}>
            {Object.values(CandidateRegionType).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input
            className={styles.textInput}
            name="label"
            defaultValue={region.label ?? ""}
            placeholder="Label (optional)"
            maxLength={80}
          />
          <button className={styles.smallButton} type="submit">
            Save
          </button>
          <button
            className={styles.smallButton}
            type="button"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <span className={styles.type}>
          {region.region_type}
          {region.label ? ` — ${region.label}` : ""}
        </span>
        <span className={styles.meta}>
          {(region.x * 100).toFixed(0)}%, {(region.y * 100).toFixed(0)}% ·{" "}
          {(region.width * 100).toFixed(0)}%×{(region.height * 100).toFixed(0)}%
        </span>
      </div>
      <div className={styles.actions}>
        <button className={styles.smallButton} type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <form
          action={deleteRegionAction}
          onSubmit={(event) => {
            if (!window.confirm("Remove this region?")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="sourceId" value={sourceId} />
          <input type="hidden" name="analysisId" value={analysisId} />
          <input type="hidden" name="regionId" value={region.id} />
          <button className={styles.smallButton} type="submit">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
