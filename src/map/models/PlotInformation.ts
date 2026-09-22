export type PlotStatus = "available" | "booked" | "registered" | "sold";

export const PLOT_STATUSES: PlotStatus[] = ["available", "booked", "registered", "sold"];

// Status colors: shown in the legend and in plot tooltip/details. Plot cells
// themselves are drawn with the uniform paper-white fill (matching the source
// layout plan), so status is conveyed on selection/hover and in the details
// panel rather than by tinting every cell.
export const STATUS_COLORS: Record<PlotStatus, string> = {
  available: "#15803d",
  booked: "#c2410c",
  registered: "#1d4ed8",
  sold: "#64748b",
};

export const STATUS_LABELS: Record<PlotStatus, string> = {
  available: "Available",
  booked: "Booked",
  registered: "Registered",
  sold: "Sold",
};

// Status fill colours used on the map polygons and the plot status board. These
// are the vivid translucent tints chosen for the satellite GIS view.
export const STATUS_FILLS: Record<PlotStatus, string> = {
  available: "#16a34a",
  booked: "#eab308",
  registered: "#3b82f6",
  sold: "#ef4444",
};

export const PLOT_FILL = "#166534";