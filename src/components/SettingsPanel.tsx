import { FolderOpen, ImagePlus } from "lucide-react";
import type { ExportSettings, RenameSettings, WatermarkPosition, WatermarkSettings } from "../types/models";

interface SettingsPanelProps {
  watermark: WatermarkSettings;
  rename: RenameSettings;
  exportSettings: ExportSettings;
  onWatermarkChange(settings: WatermarkSettings): void;
  onRenameChange(settings: RenameSettings): void;
  onExportChange(settings: ExportSettings): void;
  onSelectWatermark(): void;
  onSelectOutput(): void;
}

const positions: Array<{ value: WatermarkPosition; label: string }> = [
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "center", label: "Center" }
];

export function SettingsPanel({
  watermark,
  rename,
  exportSettings,
  onWatermarkChange,
  onRenameChange,
  onExportChange,
  onSelectWatermark,
  onSelectOutput
}: SettingsPanelProps): JSX.Element {
  return (
    <aside className="panel settingsPanel">
      <div className="panelHeader">
        <div>
          <h2>Settings</h2>
          <span>Watermark · Rename · Export</span>
        </div>
      </div>

      <section className="settingsSection">
        <h3>Watermark</h3>
        <button className="button secondary fullWidth" type="button" onClick={onSelectWatermark}>
          <ImagePlus size={16} />
          {watermark.imagePath ? "Change watermark" : "Select watermark"}
        </button>
        {watermark.imagePath && <p className="pathText">{watermark.imagePath}</p>}

        <label>
          Position
          <select
            value={watermark.position}
            onChange={(event) => onWatermarkChange({ ...watermark, position: event.target.value as WatermarkPosition })}
          >
            {positions.map((position) => (
              <option key={position.value} value={position.value}>
                {position.label}
              </option>
            ))}
          </select>
        </label>

        <Slider
          label="Margin"
          value={watermark.margin}
          min={0}
          max={240}
          suffix="px"
          onChange={(margin) => onWatermarkChange({ ...watermark, margin })}
        />
        <Slider
          label="Opacity"
          value={Math.round(watermark.opacity * 100)}
          min={5}
          max={100}
          suffix="%"
          onChange={(opacity) => onWatermarkChange({ ...watermark, opacity: opacity / 100 })}
        />
        <Slider
          label="Scale"
          value={watermark.scalePercent}
          min={5}
          max={80}
          suffix="%"
          onChange={(scalePercent) => onWatermarkChange({ ...watermark, scalePercent })}
        />

        <label className="checkRow">
          <input
            type="checkbox"
            checked={watermark.tiled}
            onChange={(event) => onWatermarkChange({ ...watermark, tiled: event.target.checked })}
          />
          Repeated watermark
        </label>
      </section>

      <section className="settingsSection">
        <h3>Rename</h3>
        <label>
          Pattern
          <input
            value={rename.pattern}
            onChange={(event) => onRenameChange({ ...rename, pattern: event.target.value })}
            placeholder="leveltech-{counter}"
          />
        </label>
        <div className="twoColumn">
          <label>
            Prefix
            <input value={rename.prefix} onChange={(event) => onRenameChange({ ...rename, prefix: event.target.value })} />
          </label>
          <label>
            Suffix
            <input value={rename.suffix} onChange={(event) => onRenameChange({ ...rename, suffix: event.target.value })} />
          </label>
        </div>
        <div className="twoColumn">
          <label>
            Start
            <input
              type="number"
              min={0}
              value={rename.startCounter}
              onChange={(event) => onRenameChange({ ...rename, startCounter: Number(event.target.value) })}
            />
          </label>
          <label>
            Padding
            <input
              type="number"
              min={0}
              max={8}
              value={rename.counterPadding}
              onChange={(event) => onRenameChange({ ...rename, counterPadding: Number(event.target.value) })}
            />
          </label>
        </div>
        <p className="hintText">Tokens: {"{original}"} {"{counter}"} {"{date}"} {"{prefix}"} {"{suffix}"}</p>
      </section>

      <section className="settingsSection">
        <h3>Export</h3>
        <button className="button secondary fullWidth" type="button" onClick={onSelectOutput}>
          <FolderOpen size={16} />
          Choose output folder
        </button>
        {exportSettings.outputFolder && <p className="pathText">{exportSettings.outputFolder}</p>}

        <Slider
          label="WebP quality"
          value={exportSettings.quality}
          min={1}
          max={100}
          suffix="%"
          onChange={(quality) => onExportChange({ ...exportSettings, quality })}
        />

        <label className="checkRow">
          <input
            type="checkbox"
            checked={exportSettings.resizeEnabled}
            onChange={(event) => onExportChange({ ...exportSettings, resizeEnabled: event.target.checked })}
          />
          Resize before export
        </label>

        <div className="twoColumn">
          <label>
            Max width
            <input
              type="number"
              min={1}
              disabled={!exportSettings.resizeEnabled}
              value={exportSettings.maxWidth ?? ""}
              onChange={(event) => onExportChange({ ...exportSettings, maxWidth: Number(event.target.value) })}
            />
          </label>
          <label>
            Max height
            <input
              type="number"
              min={1}
              disabled={!exportSettings.resizeEnabled}
              value={exportSettings.maxHeight ?? ""}
              onChange={(event) => onExportChange({ ...exportSettings, maxHeight: Number(event.target.value) })}
            />
          </label>
        </div>

        <label className="checkRow">
          <input
            type="checkbox"
            checked={exportSettings.overwriteExisting}
            onChange={(event) => onExportChange({ ...exportSettings, overwriteExisting: event.target.checked })}
          />
          Allow overwriting existing exports
        </label>
      </section>
    </aside>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange(value: number): void;
}

function Slider({ label, value, min, max, suffix, onChange }: SliderProps): JSX.Element {
  return (
    <label>
      <span className="labelLine">
        {label}
        <strong>
          {value}
          {suffix}
        </strong>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
