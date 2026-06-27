import { FileImage, ImagePlus } from "lucide-react";
import type { ImageItem } from "../types/models";
import { formatBytes } from "../utils/format";

interface ImageListProps {
  images: ImageItem[];
  selectedId?: string;
  isProcessing: boolean;
  onImport(): void;
  onSelect(id: string): void;
}

export function ImageList({ images, selectedId, isProcessing, onImport, onSelect }: ImageListProps): JSX.Element {
  return (
    <aside className="panel imagePanel">
      <div className="panelHeader">
        <div>
          <h2>Images</h2>
          <span>{images.length} imported</span>
        </div>
        <button className="iconButton" type="button" onClick={onImport} disabled={isProcessing} title="Import images">
          <ImagePlus size={18} />
        </button>
      </div>

      {images.length === 0 ? (
        <button className="dropZone" type="button" onClick={onImport}>
          <FileImage size={28} />
          <strong>Select or drop images</strong>
          <span>JPG, PNG, HEIC, WebP, TIFF, GIF, BMP</span>
        </button>
      ) : (
        <div className="imageRows">
          {images.map((image) => (
            <button
              key={image.id}
              className={`imageRow ${selectedId === image.id ? "selected" : ""}`}
              type="button"
              onClick={() => onSelect(image.id)}
            >
              <div className="fileGlyph">
                <FileImage size={18} />
              </div>
              <div className="fileText">
                <strong>{image.fileName}</strong>
                <span>
                  {image.format} · {formatBytes(image.sizeBytes)}
                  {image.width && image.height ? ` · ${image.width}x${image.height}` : ""}
                </span>
              </div>
              <span className={`status ${image.status}`}>{image.status}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
