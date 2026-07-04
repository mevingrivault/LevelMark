import { FileImage, Trash2, X } from "lucide-react";
import type { Translation } from "../i18n";
import type { ImageItem } from "../types/models";
import { formatBytes } from "../utils/format";

interface ImageListProps {
  images: ImageItem[];
  selectedId?: string;
  includedCount: number;
  disabled: boolean;
  t: Translation;
  onSelect(id: string): void;
  onToggleInclude(id: string): void;
  onSetAllIncluded(included: boolean): void;
  onRemove(id: string): void;
  onImport(): void;
  onClear(): void;
  canClear: boolean;
}

export function ImageList({
  images,
  selectedId,
  includedCount,
  disabled,
  t,
  onSelect,
  onToggleInclude,
  onSetAllIncluded,
  onRemove,
  onImport,
  onClear,
  canClear
}: ImageListProps): JSX.Element {
  const allIncluded = images.length > 0 && includedCount === images.length;

  return (
    <aside className="panel imagePanel">
      <div className="panelHeader">
        <div>
          <h2>{t.images.title}</h2>
          <span>{t.images.selectedCount(includedCount, images.length)}</span>
        </div>
        <div className="imagePanelActions">
          <button className="iconButton dangerIcon" type="button" onClick={onClear} disabled={!canClear} title={t.app.clear}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <button className="dropZone" type="button" onClick={onImport} title={t.app.import}>
          <FileImage size={28} />
          <strong>{t.images.emptyTitle}</strong>
          <span>{t.images.formats}</span>
        </button>
      ) : (
        <>
          <label className="selectAllRow checkRow">
            <input
              type="checkbox"
              checked={allIncluded}
              disabled={disabled}
              onChange={(event) => onSetAllIncluded(event.target.checked)}
            />
            {t.images.selectAll}
          </label>

          <div className="imageRows">
            {images.map((image) => (
              <div key={image.id} className={`imageRow ${selectedId === image.id ? "selected" : ""} ${image.included ? "" : "excluded"}`}>
                <input
                  type="checkbox"
                  className="imageInclude"
                  checked={image.included}
                  disabled={disabled}
                  title={image.included ? t.images.excludeImage : t.images.includeImage}
                  aria-label={image.included ? t.images.excludeImage : t.images.includeImage}
                  onChange={() => onToggleInclude(image.id)}
                />
                <button className="imageRowBody" type="button" onClick={() => onSelect(image.id)}>
                  <div className="fileGlyph">
                    <FileImage size={18} />
                  </div>
                  <div className="fileText">
                    <strong>{image.fileName}</strong>
                    <span>
                      {image.format} {"·"} {formatBytes(image.sizeBytes)}
                      {image.width && image.height ? ` · ${image.width}x${image.height}` : ""}
                    </span>
                  </div>
                  <span className={`status ${image.status}`}>{t.images.status[image.status]}</span>
                </button>
                <button
                  className="iconButton dangerIcon imageRemove"
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(image.id)}
                  title={t.images.removeImage}
                  aria-label={t.images.removeImage}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
