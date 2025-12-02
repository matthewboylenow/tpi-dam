"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/Button";

type Point = { x: number; y: number };
type Area = { width: number; height: number; x: number; y: number };

type Props = {
  imageUrl: string;
  imageName: string;
  onSave: (editedImageBlob: Blob, filename: string) => Promise<void>;
  onClose: () => void;
};

export function ImageEditor({ imageUrl, imageName, onSave, onClose }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  function handleRotate(degrees: number) {
    setRotation((prev) => (prev + degrees) % 360);
  }

  async function handleSave() {
    if (!croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const croppedBlob = await getCroppedImage(
        imageUrl,
        croppedAreaPixels,
        rotation
      );

      if (croppedBlob) {
        const filename = imageName.replace(/\.[^/.]+$/, "") + "_edited.jpg";
        await onSave(croppedBlob, filename);
      }
    } catch (error) {
      console.error("Error saving edited image:", error);
      alert("Failed to save edited image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white">Edit Image</h2>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors"
          disabled={isSaving}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Crop Area */}
      <div className="flex-1 relative">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm p-6 space-y-4">
        {/* Rotation Controls */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Rotate
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRotate(-90)}
              disabled={isSaving}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              90° Left
            </button>
            <button
              onClick={() => handleRotate(90)}
              disabled={isSaving}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              90° Right
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
            <button
              onClick={() => setRotation(0)}
              disabled={isSaving || rotation === 0}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Reset Rotation
            </button>
          </div>
        </div>

        {/* Zoom Slider */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Zoom: {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            disabled={isSaving}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            fullWidth
          >
            {isSaving ? "Saving..." : "Save Edited Image"}
          </Button>
        </div>

        <p className="text-xs text-white/60 text-center">
          Drag to reposition • Pinch or scroll to zoom • Use rotation buttons to rotate
        </p>
      </div>
    </div>
  );
}

// Helper function to create cropped image
async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const maxSize = 4096; // Max canvas size

  // Calculate dimensions
  const safeArea = Math.max(image.width, image.height) * 2;

  canvas.width = safeArea;
  canvas.height = safeArea;

  // Translate and rotate
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // Draw rotated image
  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Set canvas to final size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste cropped area
  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width / 2 - pixelCrop.x,
    0 - safeArea / 2 + image.height / 2 - pixelCrop.y
  );

  // Return as blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.95);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
