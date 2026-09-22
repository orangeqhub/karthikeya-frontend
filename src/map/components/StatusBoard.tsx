import { useMemo, useState } from "react";
import type { FC } from "react";
import type { LayoutPlotEntry } from "../layouts";
import {
  STATUS_FILLS,
  STATUS_LABELS,
  type PlotStatus,
} from "../models/PlotInformation";

interface StatusBoardProps {
  plots: LayoutPlotEntry[];
  statusByNumber?: Record<string, PlotStatus>;
  onFocusPlot: (plotId: string) => void;
  onBook: (plotNumber: string) => void;
}

function effectiveStatus(
  plot: LayoutPlotEntry,
  statusByNumber?: Record<string, PlotStatus>
): PlotStatus {
  const fromDb = statusByNumber?.[plot.plotNumber];
  if (fromDb) return fromDb;
  const fromSource = plot.status;
  if (fromSource === "booked" || fromSource === "registered" || fromSource === "sold") {
    return fromSource;
  }
  return "available";
}

// Anne Enclave reference: one chip per plot arranged in a tight grid, coloured
// by status, with a search box and an inline details area with a Book action.
const StatusBoard: FC<StatusBoardProps> = ({ plots, statusByNumber, onFocusPlot, onBook }) => {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entries = useMemo(() => plots, [plots]);

  const byNumber = useMemo(() => {
    const map = new Map<string, LayoutPlotEntry>();
    for (const p of entries) if (!map.has(p.plotNumber)) map.set(p.plotNumber, p);
    return map;
  }, [entries]);

  const counts = useMemo(() => {
    const c: Record<PlotStatus, number> = { available: 0, booked: 0, registered: 0, sold: 0 };
    for (const p of byNumber.values()) c[effectiveStatus(p, statusByNumber)] += 1;
    return c;
  }, [byNumber, statusByNumber]);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return [...byNumber.values()];
    const needle = q.toUpperCase();
    return [...byNumber.values()].filter((p) => p.plotNumber.toUpperCase().includes(needle));
  }, [byNumber, search]);

  const selected = selectedId ? byNumber.get(selectedId) ?? null : null;

  const handleSelect = (p: LayoutPlotEntry, focus: boolean) => {
    setSelectedId(p.id);
    if (focus) onFocusPlot(p.id);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const digits = value.trim().replace(/\D/g, "");
    if (!digits) return;
    const match = byNumber.get(digits);
    if (match) handleSelect(match, true);
  };

  return (
    <section className="kb-board" id="kb-board">
      <div className="kb-board-head">
        <button
          type="button"
          className="kb-board-toggle"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`kb-chevron${open ? " kb-chevron-open" : ""}`}>▾</span>
          <span className="kb-board-title">
            <span className="kb-board-name">All plots ({byNumber.size})</span>
            <span className="kb-board-sub">{counts.available} available now · {counts.booked} booked · {counts.registered} registered · {counts.sold} sold</span>
          </span>
        </button>
        <input
          className="kb-search"
          type="search"
          placeholder="Search plot no."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          aria-label="Search plot number"
        />
      </div>

      {open && (
        <div className="kb-board-body">
          {filtered.length > 0 ? (
            <div className="kb-plots">
              {filtered.map((p) => {
                const status = effectiveStatus(p, statusByNumber);
                const active = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`kb-plot${active ? " kb-plot-active" : ""}`}
                    style={{ background: STATUS_FILLS[status] }}
                    title={`${p.plotNumber} · ${STATUS_LABELS[status]}${p.areaSqYd != null ? ` · ${p.areaSqYd} sq.yd` : ""}`}
                    onClick={() => handleSelect(p, true)}
                  >
                    {p.plotNumber}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="kb-board-empty">No plots match &quot;{search.trim()}&quot;.</p>
          )}

          {selected ? (
            <div className="kb-details">
              <dl className="kb-details-grid">
                <div className="kb-detail">
                  <dt>Plot No:</dt>
                  <dd>{selected.plotNumber}</dd>
                </div>
                <div className="kb-detail">
                  <dt>Type:</dt>
                  <dd>Residential</dd>
                </div>
                <div className="kb-detail">
                  <dt>Status:</dt>
                  <dd>
                    <span className="kb-status-dot" style={{ background: STATUS_FILLS[effectiveStatus(selected, statusByNumber)] }} />
                    {STATUS_LABELS[effectiveStatus(selected, statusByNumber)]}
                  </dd>
                </div>
                <div className="kb-detail">
                  <dt>Area:</dt>
                  <dd>{selected.areaSqYd != null ? `${selected.areaSqYd} Sq.Yds` : "-"}</dd>
                </div>
                <div className="kb-detail">
                  <dt>Dimensions:</dt>
                  <dd>
                    {selected.dimensions?.width ? `${selected.dimensions.width} x ${selected.dimensions.depth}` : "-"}
                  </dd>
                </div>
              </dl>
              {effectiveStatus(selected, statusByNumber) === "available" ? (
                <button className="kb-book-btn" onClick={() => onBook(selected.plotNumber)}>
                  Book this plot
                </button>
              ) : (
                <p className="kb-not-available">
                  This plot is <b>{STATUS_LABELS[effectiveStatus(selected, statusByNumber)]}</b> and not
                  currently available for booking.
                </p>
              )}
            </div>
          ) : (
            <p className="kb-board-hint">Select a plot from the board to view its details.</p>
          )}
        </div>
      )}
    </section>
  );
};

export default StatusBoard;
export { effectiveStatus };