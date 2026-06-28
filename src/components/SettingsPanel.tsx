import { FolderOpen, ImagePlus } from "lucide-react";
import type { Translation } from "../i18n";
import type { ExportSettings, RenameSettings, WatermarkPosition, WatermarkSettings } from "../types/models";

interface SettingsPanelProps {
  watermark: WatermarkSettings;
  rename: RenameSettings;
  exportSettings: ExportSettings;
  t: Translation;
  onWatermarkChange(settings: WatermarkSettings): void;
  onRenameChange(settings: RenameSettings): void;
  onExportChange(settings: ExportSettings): void;
  onSelectWatermark(): void;
  onSelectOutput(): void;
}

const positions: WatermarkPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right", "center"];

export function SettingsPanel({
  watermark,
  rename,
  exportSettings,
  t,
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
          <h2>{t.settings.title}</h2>
          <span>{t.settings.summary}</span>
        </div>
      </div>

      <section className="settingsSection">
        <h3>{t.settings.watermark}</h3>
        <button className="button secondary fullWidth" type="button" onClick={onSelectWatermark}>
          <ImagePlus size={16} />
          {watermark.imagePath ? t.settings.changeWatermark : t.settings.selectWatermark}
        </button>
        {watermark.imagePath && <p className="pathText">{watermark.imagePath}</p>}

        <label>
          {t.settings.position}
          <select
            value={watermark.position}
            onChange={(event) => onWatermarkChange({ ...watermark, position: event.target.value as WatermarkPosition })}
          >
            {positions.map((position) => (
              <option key={position} value={position}>
                {t.settings.positions[position]}
              </option>
            ))}
          </select>
        </label>

        <Slider
          label={t.settings.margin}
          value={watermark.margin}
          min={0}
          max={240}
          suffix="px"
          onChange={(margin) => onWatermarkChange({ ...watermark, margin })}
        />
        <Slider
          label={t.settings.opacity}
          value={Math.round(watermark.opacity * 100)}
          min={5}
          max={100}
          suffix="%"
          onChange={(opacity) => onWatermarkChange({ ...watermark, opacity: opacity / 100 })}
        />
        <Slider
          label={t.settings.scale}
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
          {t.settings.repeatedWatermark}
        </label>
      </section>

      <section className="settingsSection">
        <h3>{t.settings.rename}</h3>
        <label>
          {t.settings.pattern}
          <input
            value={rename.pattern}
            onChange={(event) => onRenameChange({ ...rename, pattern: event.target.value })}
            placeholder="leveltech-{counter}"
          />
        </label>
        <div className="twoColumn">
          <label>
            {t.settings.prefix}
            <input value={rename.prefix} onChange={(event) => onRenameChange({ ...rename, prefix: event.target.value })} />
          </label>
          <label>
            {t.settings.suffix}
            <input value={rename.suffix} onChange={(event) => onRenameChange({ ...rename, suffix: event.target.value })} />
          </label>
        </div>
        <div className="twoColumn">
          <label>
            {t.settings.start}
            <input
              type="number"
              min={0}
              value={rename.startCounter}
              onChange={(event) => onRenameChange({ ...rename, startCounter: Number(event.target.value) })}
            />
          </label>
          <label>
            {t.settings.padding}
            <input
              type="number"
              min={0}
              max={8}
              value={rename.counterPadding}
              onChange={(event) => onRenameChange({ ...rename, counterPadding: Number(event.target.value) })}
            />
          </label>
        </div>
        <p className="hintText">{t.settings.tokens} {"{original}"} {"{counter}"} {"{date}"} {"{prefix}"} {"{suffix}"}</p>
      </section>

      <section className="settingsSection">
        <h3>{t.settings.export}</h3>
        <button className="button secondary fullWidth" type="button" onClick={onSelectOutput}>
          <FolderOpen size={16} />
          {t.settings.chooseOutputFolder}
        </button>
        {exportSettings.outputFolder && <p className="pathText">{exportSettings.outputFolder}</p>}

        <Slider
          label={t.settings.webpQuality}
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
          {t.settings.resizeBeforeExport}
        </label>

        <div className="twoColumn">
          <label>
            {t.settings.maxWidth}
            <input
              type="number"
              min={1}
              disabled={!exportSettings.resizeEnabled}
              value={exportSettings.maxWidth ?? ""}
              onChange={(event) => onExportChange({ ...exportSettings, maxWidth: Number(event.target.value) })}
            />
          </label>
          <label>
            {t.settings.maxHeight}
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
          {t.settings.overwriteExisting}
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
