import { Play } from "lucide-react";
import type { Translation } from "../i18n";

interface BottomBarProps {
  canExport: boolean;
  progress: number;
  isProcessing: boolean;
  outputFolder?: string;
  summary?: string;
  blockedReason?: string;
  t: Translation;
  onExport(): void;
}

export function BottomBar({
  canExport,
  progress,
  isProcessing,
  outputFolder,
  summary,
  blockedReason,
  t,
  onExport
}: BottomBarProps): JSX.Element {
  return (
    <footer className="bottomBar">
      <div className="progressBlock">
        <div className="progressMeta">
          <span>{isProcessing ? t.bottom.exporting : (summary ?? blockedReason ?? t.bottom.ready)}</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <div className="progressTrack">
          <div className="progressFill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>

      <div className="bottomOutput">{outputFolder ?? t.bottom.noOutputFolder}</div>

      <button className="button primary" type="button" disabled={!canExport} onClick={onExport}>
        <Play size={17} />
        {t.bottom.exportWebp}
      </button>
    </footer>
  );
}
