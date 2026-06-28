import { Download, FolderOpen, ImagePlus, RefreshCcw, Save, Trash2, Upload } from "lucide-react";
import { defaultExport, defaultRename, defaultWatermark } from "../app/defaults";
import type { Translation } from "../i18n";
import type { ExportSettings, ImageItem, RenameSettings, UserProfile, WatermarkPosition, WatermarkSettings } from "../types/models";
import { buildPreviewName } from "../utils/previewName";

interface SettingsPanelProps {
  watermark: WatermarkSettings;
  rename: RenameSettings;
  exportSettings: ExportSettings;
  profiles: UserProfile[];
  selectedProfileId?: string;
  profileName: string;
  previewImage?: ImageItem;
  previewImageIndex: number;
  t: Translation;
  onProfileSelect(profileId: string): void;
  onProfileNameChange(name: string): void;
  onProfileSave(): void;
  onProfileImport(): void;
  onProfileExport(): void;
  onProfileDelete(): void;
  onWatermarkChange(settings: WatermarkSettings): void;
  onRenameChange(settings: RenameSettings): void;
  onExportChange(settings: ExportSettings): void;
  onSelectWatermark(): void;
  onSelectOutput(): void;
}

const positions: WatermarkPosition[] = ["top-left", "top-right", "bottom-left", "bottom-right", "center"];
const renameTokens = ["{original}", "{counter}", "{date}", "{prefix}", "{suffix}"] as const;

function appendRenameToken(pattern: string, token: string): string {
  const trimmed = pattern.trim();
  return trimmed.length === 0 ? token : `${trimmed}-${token}`;
}

function resetTitle(t: Translation, label: string): string {
  return t.settings.resetSetting(label);
}

export function SettingsPanel({
  watermark,
  rename,
  exportSettings,
  profiles,
  selectedProfileId,
  profileName,
  previewImage,
  previewImageIndex,
  t,
  onProfileSelect,
  onProfileNameChange,
  onProfileSave,
  onProfileImport,
  onProfileExport,
  onProfileDelete,
  onWatermarkChange,
  onRenameChange,
  onExportChange,
  onSelectWatermark,
  onSelectOutput
}: SettingsPanelProps): JSX.Element {
  const renameExample = previewImage ? buildPreviewName(previewImage, previewImageIndex, rename) : t.settings.renameExampleEmpty;

  return (
    <aside className="panel settingsPanel">
      <div className="panelHeader">
        <div>
          <h2>{t.settings.title}</h2>
          <span>{t.settings.summary}</span>
        </div>
      </div>


      <section className="settingsSection">
        <h3>{t.profiles.title}</h3>
        <label>
          {t.profiles.select}
          <select value={selectedProfileId ?? ""} onChange={(event) => onProfileSelect(event.target.value)}>
            <option value="">{t.profiles.noProfile}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.profiles.namePrompt}
          <input
            value={profileName}
            onChange={(event) => onProfileNameChange(event.target.value)}
            placeholder={t.profiles.defaultName}
          />
        </label>
        <div className="profileActions">
          <button className="button secondary" type="button" onClick={onProfileSave}>
            <Save size={15} />
            {t.profiles.save}
          </button>
          <button className="iconButton" type="button" onClick={onProfileImport} title={t.profiles.import}>
            <Upload size={16} />
          </button>
          <button className="iconButton" type="button" onClick={onProfileExport} disabled={!selectedProfileId} title={t.profiles.export}>
            <Download size={16} />
          </button>
          <button className="iconButton dangerIcon" type="button" onClick={onProfileDelete} disabled={!selectedProfileId} title={t.profiles.delete}>
            <Trash2 size={16} />
          </button>
        </div>
      </section>

      <section className="settingsSection">
        <h3>{t.settings.watermark}</h3>
        <div className="resettableField">
          <button className="button secondary fullWidth" type="button" onClick={onSelectWatermark}>
            <ImagePlus size={16} />
            {watermark.imagePath ? t.settings.changeWatermark : t.settings.selectWatermark}
          </button>
          <ResetButton
            disabled={watermark.imagePath === defaultWatermark.imagePath}
            title={resetTitle(t, t.settings.watermark)}
            onReset={() => onWatermarkChange({ ...watermark, imagePath: defaultWatermark.imagePath })}
          />
        </div>
        {watermark.imagePath && <p className="pathText">{watermark.imagePath}</p>}

        <div className="resettableField">
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
          <ResetButton
            disabled={watermark.position === defaultWatermark.position}
            title={resetTitle(t, t.settings.position)}
            onReset={() => onWatermarkChange({ ...watermark, position: defaultWatermark.position })}
          />
        </div>

        <Slider
          label={t.settings.margin}
          value={watermark.margin}
          min={0}
          max={240}
          suffix="px"
          resetDisabled={watermark.margin === defaultWatermark.margin}
          resetTitle={resetTitle(t, t.settings.margin)}
          onChange={(margin) => onWatermarkChange({ ...watermark, margin })}
          onReset={() => onWatermarkChange({ ...watermark, margin: defaultWatermark.margin })}
        />
        <Slider
          label={t.settings.opacity}
          value={Math.round(watermark.opacity * 100)}
          min={5}
          max={100}
          suffix="%"
          resetDisabled={watermark.opacity === defaultWatermark.opacity}
          resetTitle={resetTitle(t, t.settings.opacity)}
          onChange={(opacity) => onWatermarkChange({ ...watermark, opacity: opacity / 100 })}
          onReset={() => onWatermarkChange({ ...watermark, opacity: defaultWatermark.opacity })}
        />
        <Slider
          label={t.settings.scale}
          value={watermark.scalePercent}
          min={5}
          max={80}
          suffix="%"
          resetDisabled={watermark.scalePercent === defaultWatermark.scalePercent}
          resetTitle={resetTitle(t, t.settings.scale)}
          onChange={(scalePercent) => onWatermarkChange({ ...watermark, scalePercent })}
          onReset={() => onWatermarkChange({ ...watermark, scalePercent: defaultWatermark.scalePercent })}
        />

        <div className="resettableCheckRow">
          <label className="checkRow">
            <input
              type="checkbox"
              checked={watermark.tiled}
              onChange={(event) => onWatermarkChange({ ...watermark, tiled: event.target.checked })}
            />
            {t.settings.repeatedWatermark}
          </label>
          <ResetButton
            disabled={watermark.tiled === defaultWatermark.tiled}
            title={resetTitle(t, t.settings.repeatedWatermark)}
            onReset={() => onWatermarkChange({ ...watermark, tiled: defaultWatermark.tiled })}
          />
        </div>
      </section>

      <section className="settingsSection">
        <h3>{t.settings.rename}</h3>
        <div className="resettableField">
          <label>
            {t.settings.pattern}
            <input
              value={rename.pattern}
              onChange={(event) => onRenameChange({ ...rename, pattern: event.target.value })}
              placeholder="leveltech-{counter}"
            />
          </label>
          <ResetButton
            disabled={rename.pattern === defaultRename.pattern}
            title={resetTitle(t, t.settings.pattern)}
            onReset={() => onRenameChange({ ...rename, pattern: defaultRename.pattern })}
          />
        </div>
        <div className="renameTokenGroup" aria-label={t.settings.tokens}>
          {renameTokens.map((token) => (
            <button
              key={token}
              className="tokenButton"
              type="button"
              onClick={() => onRenameChange({ ...rename, pattern: appendRenameToken(rename.pattern, token) })}
              title={token}
            >
              {t.settings.renameTokens[token]}
            </button>
          ))}
        </div>
        <p className="exampleText">
          <span>{t.settings.renameExample}</span>
          <strong>{renameExample}</strong>
        </p>
        <div className="twoColumn">
          <div className="resettableField">
            <label>
              {t.settings.prefix}
              <input value={rename.prefix} onChange={(event) => onRenameChange({ ...rename, prefix: event.target.value })} />
            </label>
            <ResetButton
              disabled={rename.prefix === defaultRename.prefix}
              title={resetTitle(t, t.settings.prefix)}
              onReset={() => onRenameChange({ ...rename, prefix: defaultRename.prefix })}
            />
          </div>
          <div className="resettableField">
            <label>
              {t.settings.suffix}
              <input value={rename.suffix} onChange={(event) => onRenameChange({ ...rename, suffix: event.target.value })} />
            </label>
            <ResetButton
              disabled={rename.suffix === defaultRename.suffix}
              title={resetTitle(t, t.settings.suffix)}
              onReset={() => onRenameChange({ ...rename, suffix: defaultRename.suffix })}
            />
          </div>
        </div>
        <div className="twoColumn">
          <div className="resettableField">
            <label>
              {t.settings.start}
              <input
                type="number"
                min={0}
                value={rename.startCounter}
                onChange={(event) => onRenameChange({ ...rename, startCounter: Number(event.target.value) })}
              />
            </label>
            <ResetButton
              disabled={rename.startCounter === defaultRename.startCounter}
              title={resetTitle(t, t.settings.start)}
              onReset={() => onRenameChange({ ...rename, startCounter: defaultRename.startCounter })}
            />
          </div>
          <div className="resettableField">
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
            <ResetButton
              disabled={rename.counterPadding === defaultRename.counterPadding}
              title={resetTitle(t, t.settings.padding)}
              onReset={() => onRenameChange({ ...rename, counterPadding: defaultRename.counterPadding })}
            />
          </div>
        </div>
      </section>

      <section className="settingsSection">
        <h3>{t.settings.export}</h3>
        <div className="resettableField">
          <button className="button secondary fullWidth" type="button" onClick={onSelectOutput}>
            <FolderOpen size={16} />
            {t.settings.chooseOutputFolder}
          </button>
          <ResetButton
            disabled={exportSettings.outputFolder === defaultExport.outputFolder}
            title={resetTitle(t, t.settings.chooseOutputFolder)}
            onReset={() => onExportChange({ ...exportSettings, outputFolder: defaultExport.outputFolder })}
          />
        </div>
        {exportSettings.outputFolder && <p className="pathText">{exportSettings.outputFolder}</p>}

        <Slider
          label={t.settings.webpQuality}
          value={exportSettings.quality}
          min={1}
          max={100}
          suffix="%"
          resetDisabled={exportSettings.quality === defaultExport.quality}
          resetTitle={resetTitle(t, t.settings.webpQuality)}
          onChange={(quality) => onExportChange({ ...exportSettings, quality })}
          onReset={() => onExportChange({ ...exportSettings, quality: defaultExport.quality })}
        />

        <div className="resettableCheckRow">
          <label className="checkRow">
            <input
              type="checkbox"
              checked={exportSettings.resizeEnabled}
              onChange={(event) => onExportChange({ ...exportSettings, resizeEnabled: event.target.checked })}
            />
            {t.settings.resizeBeforeExport}
          </label>
          <ResetButton
            disabled={exportSettings.resizeEnabled === defaultExport.resizeEnabled}
            title={resetTitle(t, t.settings.resizeBeforeExport)}
            onReset={() => onExportChange({ ...exportSettings, resizeEnabled: defaultExport.resizeEnabled })}
          />
        </div>

        <div className="twoColumn">
          <div className="resettableField">
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
            <ResetButton
              disabled={exportSettings.maxWidth === defaultExport.maxWidth}
              title={resetTitle(t, t.settings.maxWidth)}
              onReset={() => onExportChange({ ...exportSettings, maxWidth: defaultExport.maxWidth })}
            />
          </div>
          <div className="resettableField">
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
            <ResetButton
              disabled={exportSettings.maxHeight === defaultExport.maxHeight}
              title={resetTitle(t, t.settings.maxHeight)}
              onReset={() => onExportChange({ ...exportSettings, maxHeight: defaultExport.maxHeight })}
            />
          </div>
        </div>

        <div className="resettableCheckRow">
          <label className="checkRow">
            <input
              type="checkbox"
              checked={exportSettings.overwriteExisting}
              onChange={(event) => onExportChange({ ...exportSettings, overwriteExisting: event.target.checked })}
            />
            {t.settings.overwriteExisting}
          </label>
          <ResetButton
            disabled={exportSettings.overwriteExisting === defaultExport.overwriteExisting}
            title={resetTitle(t, t.settings.overwriteExisting)}
            onReset={() => onExportChange({ ...exportSettings, overwriteExisting: defaultExport.overwriteExisting })}
          />
        </div>
      </section>
    </aside>
  );
}

interface ResetButtonProps {
  disabled: boolean;
  title: string;
  onReset(): void;
}

function ResetButton({ disabled, title, onReset }: ResetButtonProps): JSX.Element {
  return (
    <button className="iconButton resetButton" type="button" onClick={onReset} disabled={disabled} title={title} aria-label={title}>
      <RefreshCcw size={14} />
    </button>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  resetDisabled: boolean;
  resetTitle: string;
  onChange(value: number): void;
  onReset(): void;
}

function Slider({ label, value, min, max, suffix, resetDisabled, resetTitle, onChange, onReset }: SliderProps): JSX.Element {
  return (
    <div className="resettableField">
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
      <ResetButton disabled={resetDisabled} title={resetTitle} onReset={onReset} />
    </div>
  );
}
