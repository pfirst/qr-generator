/// <reference types="vite/client" />

// BarcodeDetector is not yet in the standard TS DOM lib in all versions.
interface BarcodeDetectorOptions {
  formats?: string[]
}
interface DetectedBarcode {
  rawValue: string
}
declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<string[]>
  detect(source: CanvasImageSource | ImageBitmap | Blob): Promise<DetectedBarcode[]>
}
