import { useMemo } from "react";
import { ImageOff } from "lucide-react";
import { getWatermarkPlacement } from "../core/watermark/placement";
import type { Translation } from "../i18n";
import type { DisplayImage, ImageItem, RenameSettings, WatermarkSettings } from "../types/models";
import { buildPreviewName } from "../utils/previewName";

interface PreviewPaneProps {
  image?: ImageItem;
  preview?: DisplayImage;
  watermark: WatermarkSettings;
  watermarkPreview?: DisplayImage;
  rename: RenameSettings;
  imageIndex: number;
  t: Translation;
}

export function PreviewPane({
  image,
  preview,
  watermark,
  watermarkPreview,
  rename,
  imageIndex,
  t
}: PreviewPaneProps): JSX.Element {
  const watermarkStyle = useMemo(() => {
    if (!preview?.width || !preview.height || !watermarkPreview?.width || !watermarkPreview.height) {
      return undefined;
    }

    const watermarkWidth = preview.width * (watermark.scalePercent / 100);
    const watermarkHeight = watermarkWidth * (watermarkPreview.height / watermarkPreview.width);
    const placement = getWatermarkPlacement({
      imageWidth: preview.width,
      imageHeight: preview.height,
      watermarkWidth,
      watermarkHeight,
      margin: watermark.margin,
      position: watermark.position
    });

    return {
      left: `${(placement.left / preview.width) * 100}%`,
      top: `${(placement.top / preview.height) * 100}%`,
      width: `${(watermarkWidth / preview.width) * 100}%`,
      opacity: watermark.opacity
    };
  }, [preview, watermark.margin, watermark.opacity, watermark.position, watermark.scalePercent, watermarkPreview]);

  return (
    <section className="previewPane">
      <div className="previewHeader">
        <div>
          <h2>{t.preview.title}</h2>
          <span>{image ? buildPreviewName(image, imageIndex, rename) : t.preview.noImageSelected}</span>
        </div>
      </div>

      <div className="previewStage">
        {preview ? (
          <div className="imageFrame">
            <img className="basePreview" src={preview.dataUrl} alt={image?.fileName ?? t.preview.selectedImageAlt} />
            {watermarkPreview && watermarkStyle && !watermark.tiled && (
              <img className="watermarkPreview" src={watermarkPreview.dataUrl} alt="" style={watermarkStyle} />
            )}
            {watermarkPreview && watermark.tiled && (
              <div
                className="watermarkTile"
                style={{
                  opacity: watermark.opacity,
                  backgroundImage: `url(${watermarkPreview.dataUrl})`,
                  backgroundSize: `${watermark.scalePercent}% auto`
                }}
              />
            )}
          </div>
        ) : (
          <div className="emptyPreview">
            <ImageOff size={36} />
            <span>{t.preview.empty}</span>
          </div>
        )}
      </div>
    </section>
  );
}
