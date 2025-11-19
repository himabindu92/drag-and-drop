// App.jsx
import React, { useState, useEffect } from "react";

const PALETTE_BLOCKS = [
  // Metrics
  { type: "kpi", label: "KPI Metric", category: "Metrics" },

  // Visualizations
  { type: "chart_bar", label: "Bar Chart", category: "Visualizations" },
  { type: "chart_line", label: "Line Chart", category: "Visualizations" },

  // Filters
  { type: "filter_dropdown", label: "Dropdown Filter", category: "Filters" },
  { type: "filter_date", label: "Date Range Filter", category: "Filters" },

  // Layouts
  { type: "layout_two_column", label: "Two Column Layout", category: "Layouts" },
];

const STORAGE_KEY = "reportBuilderLayout";

function App() {
  const [canvasBlocks, setCanvasBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load saved report on first render (optional but nice for demo)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCanvasBlocks(JSON.parse(saved));
      } catch {
        console.warn("Failed to parse saved layout");
      }
    }
  }, []);

  // -------------------------------
  // Saving & Exporting
  // -------------------------------
  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvasBlocks));
    alert("Report layout saved (localStorage).");
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(canvasBlocks, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "report-layout.json";
    a.click();
  };

  // -------------------------------
  // Drag from palette
  // -------------------------------
  const handlePaletteDragStart = (event, type) => {
    event.dataTransfer.setData("application/x-block-type", type);
    event.dataTransfer.effectAllowed = "copy";
  };

  // -------------------------------
  // Drop onto canvas
  // -------------------------------
  const handleCanvasDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/x-block-type");
    if (!type) return;

    const newBlock = {
      id: Date.now().toString(),
      type,
      title: getDefaultTitle(type),
      config: getDefaultConfig(type),
    };

    setCanvasBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleCanvasDragOver = (event) => {
    event.preventDefault();
  };

  // -------------------------------
  // Reorder blocks inside canvas
  // -------------------------------
  const handleCanvasBlockDragStart = (event, id) => {
    event.dataTransfer.setData("application/x-block-id", id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleCanvasBlockDrop = (event, targetId) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("application/x-block-id");
    if (!draggedId || draggedId === targetId) return;

    setCanvasBlocks((prev) => {
      const draggedIndex = prev.findIndex((b) => b.id === draggedId);
      const targetIndex = prev.findIndex((b) => b.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev.slice();

      const updated = prev.slice();
      const [dragged] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, dragged);
      return updated;
    });
  };

  // -------------------------------
  // Selection & Editing
  // -------------------------------
  const handleSelectBlock = (id) => {
    setSelectedBlockId(id);
  };

  const handleDeleteBlock = (id) => {
    setCanvasBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleBlockTitleChange = (id, value) => {
    setCanvasBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, title: value } : b))
    );
  };

  const handleBlockConfigChange = (id, key, value) => {
    setCanvasBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, config: { ...b.config, [key]: value } } : b
      )
    );
  };

  const selectedBlock = canvasBlocks.find((b) => b.id === selectedBlockId) || null;

  // -------------------------------// UI // -------------------------------


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-blue">
        <h1 className="text-lg font-semibold tracking-tight">
          Report Builder 
        </h1>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm rounded-md border bg-white hover:bg-red-200"
          >
            Save Report
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="px-3 py-1 text-sm rounded-md border bg-white hover:bg-red-200"
          >
            Preview
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1 text-sm rounded-md bg-slate-900 text-white hover:bg-red-800"
          >
            Export JSON
          </button>
        </div>
      </header>

      {/* Main Layout: [ Components | Canvas | Editor ] */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Components Palette */}
        <aside className="w-64 border-r bg-white p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Components
          </h2>

          <p className="text-xs text-slate-500 mb-2">
            Drag components into the canvas.
          </p>

          <PaletteSection
            title="Metrics"
            items={PALETTE_BLOCKS.filter((b) => b.category === "Metrics")}
            onDragStart={handlePaletteDragStart}
          />
          <PaletteSection
            title="Visualizations"
            items={PALETTE_BLOCKS.filter((b) => b.category === "Visualizations")}
            onDragStart={handlePaletteDragStart}
          />
          <PaletteSection
            title="Filters"
            items={PALETTE_BLOCKS.filter((b) => b.category === "Filters")}
            onDragStart={handlePaletteDragStart}
          />
          <PaletteSection
            title="Layouts"
            items={PALETTE_BLOCKS.filter((b) => b.category === "Layouts")}
            onDragStart={handlePaletteDragStart}
          />
        </aside>

        {/* CENTER: Canvas */}
        <main className="flex-1 p-4 overflow-auto">
          <div
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            className="min-h-[600px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/60 p-4 flex flex-col gap-3"
          >
            {canvasBlocks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <span>Drop components here to build your report.</span>
               
              </div>
            )}

            {canvasBlocks.map((block) => {
              const isSelected = block.id === selectedBlockId;

              return (
                <section
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleCanvasBlockDragStart(e, block.id)}
                  onDrop={(e) => handleCanvasBlockDrop(e, block.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => handleSelectBlock(block.id)}
                  className={`group bg-white rounded-xl border shadow-sm px-4 py-3 flex flex-col gap-2 cursor-pointer ${
                    isSelected ? "ring-2 ring-slate-500" : "cursor-grab"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {formatTypeLabel(block.type)}
                    </span>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-slate-400">Drag</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">{block.title}</p>
                    <p className="text-xs text-slate-500">
                      {summarizeConfig(block.type, block.config)}
                    </p>
                  </div>
                </section>
              );
            })}
          </div>
        </main>

        {/* RIGHT: Configuration Panel */}
        <aside className="w-80 border-l bg-white p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Component Settings
          </h2>

          {!selectedBlock && (
            <p className="text-xs text-slate-400">
              Select a component on the canvas to configure it.
            </p>
          )}

          {selectedBlock && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Title
                </label>
                <input
                  type="text"
                  value={selectedBlock.title}
                  onChange={(e) =>
                    handleBlockTitleChange(selectedBlock.id, e.target.value)
                  }
                  className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <ComponentConfigForm
                block={selectedBlock}
                onChange={(key, value) =>
                  handleBlockConfigChange(selectedBlock.id, key, value)
                }
              />
            </div>
          )}
        </aside>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <PreviewModal
          blocks={canvasBlocks}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// -------------------------------
// Palette Section
// -------------------------------
function PaletteSection({ title, items, onDragStart }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 mb-1">{title}</h3>
      <div className="flex flex-col gap-2 mb-3">
        {items.map((block) => (
          <div
            key={block.type}
            draggable
            onDragStart={(e) => onDragStart(e, block.type)}
            className="cursor-grab rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 active:cursor-grabbing"
          >
            <span>{block.label}</span>
            <span className="text-[10px] text-slate-400">Drag</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------
// Config Forms
// -------------------------------
function ComponentConfigForm({ block, onChange }) {
  const { type, config } = block;

  if (type === "kpi") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">
            Metric Value
          </label>
          <input
            type="number"
            value={config.value}
            onChange={(e) => onChange("value", e.target.value)}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            Unit (e.g. ₹, %, users)
          </label>
          <input
            type="text"
            value={config.unit}
            onChange={(e) => onChange("unit", e.target.value)}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Trend</label>
          <input
            type="text"
            value={config.trend}
            onChange={(e) => onChange("trend", e.target.value)}
            placeholder="+12% vs last month"
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>
    );
  }

  if (type === "chart_bar" || type === "chart_line") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">
            X-Axis Field
          </label>
          <input
            type="text"
            value={config.xField}
            onChange={(e) => onChange("xField", e.target.value)}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            Y-Axis Field
          </label>
          <input
            type="text"
            value={config.yField}
            onChange={(e) => onChange("yField", e.target.value)}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            Description / Notes
          </label>
          <textarea
            value={config.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={3}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>
    );
  }

  if (type === "filter_dropdown") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">
            Field Name
          </label>
          <input
            type="text"
            value={config.field}
            onChange={(e) => onChange("field", e.target.value)}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            Options (comma separated)
          </label>
          <input
            type="text"
            value={config.options}
            onChange={(e) => onChange("options", e.target.value)}
            placeholder="North, South, East, West"
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>
    );
  }

  if (type === "filter_date") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">
            Default Range
          </label>
          <select
            value={config.defaultRange}
            onChange={(e) => onChange("defaultRange", e.target.value)}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="this_month">This month</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
    );
  }

  if (type === "layout_two_column") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">
            Column Ratio
          </label>
          <select
            value={config.columns}
            onChange={(e) => onChange("columns", e.target.value)}
            className="mt-1 w-full border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="1:1">1 : 1 (Equal)</option>
            <option value="2:1">2 : 1 (Wide Left)</option>
            <option value="1:2">1 : 2 (Wide Right)</option>
          </select>
        </div>
        <p className="text-[11px] text-slate-500">
          In a real app, this layout would control how child components are
          arranged.
        </p>
      </div>
    );
  }

  return (
    <p className="text-xs text-slate-400">
      No special configuration available for this component.
    </p>
  );
}

// -------------------------------
// Preview Modal
// -------------------------------
function PreviewModal({ blocks, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[700px] max-h-[80vh] overflow-auto rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Report Preview</h2>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded-md border bg-white hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {blocks.length === 0 ? (
          <p className="text-slate-500 text-sm text-center">
            No components in the report yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="border rounded-lg p-4 bg-slate-50"
              >
                <h3 className="font-semibold mb-1 text-sm">{block.title}</h3>
                <p className="text-xs text-slate-500 mb-2">
                  {formatTypeLabel(block.type)}
                </p>
                <p className="text-sm text-slate-700">
                  {summarizeConfig(block.type, block.config)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------
// Helpers
// -------------------------------
function getDefaultTitle(type) {
  switch (type) {
    case "kpi":
      return "Revenue KPI";
    case "chart_bar":
      return "Sales by Category";
    case "chart_line":
      return "Trend Over Time";
    case "filter_dropdown":
      return "Region Filter";
    case "filter_date":
      return "Date Range Filter";
    case "layout_two_column":
      return "Two Column Layout";
    default:
      return "Component";
  }
}

function getDefaultConfig(type) {
  switch (type) {
    case "kpi":
      return {
        value: 12345,
        unit: "₹",
        trend: "+12% vs last month",
      };
    case "chart_bar":
    case "chart_line":
      return {
        xField: "date",
        yField: "revenue",
        description: "Sample chart configuration.",
      };
    case "filter_dropdown":
      return {
        field: "region",
        options: "North, South, East, West",
      };
    case "filter_date":
      return {
        defaultRange: "last_30_days",
      };
    case "layout_two_column":
      return {
        columns: "1:1",
      };
    default:
      return {};
  }
}

function formatTypeLabel(type) {
  switch (type) {
    case "kpi":
      return "KPI Metric";
    case "chart_bar":
      return "Bar Chart";
    case "chart_line":
      return "Line Chart";
    case "filter_dropdown":
      return "Dropdown Filter";
    case "filter_date":
      return "Date Range Filter";
    case "layout_two_column":
      return "Two Column Layout";
    default:
      return type;
  }
}

function summarizeConfig(type, config) {
  if (type === "kpi") {
    return `${config.unit ?? ""}${config.value ?? ""} (${config.trend ?? ""})`;
  }

  if (type === "chart_bar" || type === "chart_line") {
    return `X: ${config.xField}, Y: ${config.yField}. ${config.description ?? ""}`;
  }

 if (type === "filter_dropdown") {
    return `Field: ${config.field}, Options: ${config.options}`;
  }

  if (type === "filter_date") {
    return `Default range: ${config.defaultRange}`;
  }

  if (type === "layout_two_column") {
    return `Columns: ${config.columns}`;
  }

  return "No summary available.";
}

export default App;