import type { CandidateRegionType } from "@/types/domain";

/**
 * Contract for creative image-processing providers (Adobe, manual, future
 * ChatGPT/OCR providers, etc). Domain and UI code depend only on this
 * contract — never on a specific provider's request/response shapes.
 *
 * A provider that cannot perform an operation (missing credentials,
 * unimplemented capability, service outage) MUST return an "UNSUPPORTED"
 * or "UNAVAILABLE" result. Providers must never fabricate a "COMPLETED"
 * result for work they did not actually perform.
 */

/** Individual automated/assisted operations a provider may support. */
export enum CreativeCapability {
  ANALYZE_IMAGE = "ANALYZE_IMAGE",
  SELECT_REGION = "SELECT_REGION",
  CROP_OBJECT = "CROP_OBJECT",
  REMOVE_BACKGROUND = "REMOVE_BACKGROUND",
  CLEANUP_ARTWORK = "CLEANUP_ARTWORK",
  RECONSTRUCT_ARTWORK = "RECONSTRUCT_ARTWORK",
  VECTORIZE_ARTWORK = "VECTORIZE_ARTWORK",
  INSPECT_ARTWORK = "INSPECT_ARTWORK",
  EXPORT_ASSET = "EXPORT_ASSET",
}

/** Whether a provider is currently able to do any work at all. */
export enum ProviderAvailability {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
  NOT_CONFIGURED = "NOT_CONFIGURED",
}

/** Provider-agnostic reference to a stored asset (source, extraction, etc). */
export interface CreativeAssetRef {
  id: string;
  uri: string;
  mimeType: string;
}

/** Normalized (0-1) bounding box, independent of source image resolution. */
export interface NormalizedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A detected or human-marked region of interest on a source image. */
export interface CreativeRegion {
  type: CandidateRegionType;
  boundingBox: NormalizedBoundingBox;
  /** 0-1 confidence, only meaningful for machine-detected regions. */
  confidence?: number;
  label?: string;
}

/**
 * Discriminated union describing the outcome of a capability call.
 * "COMPLETED" is the only status that carries real output data.
 */
export type CreativeOperationResult<TData> =
  | { status: "COMPLETED"; provider: string; data: TData }
  | { status: "UNSUPPORTED"; provider: string; reason: string }
  | { status: "UNAVAILABLE"; provider: string; reason: string }
  | { status: "FAILED"; provider: string; reason: string };

export interface AnalyzeImageParams {
  asset: CreativeAssetRef;
}
export interface AnalyzeImageResult {
  regions: CreativeRegion[];
}

export interface SelectRegionParams {
  asset: CreativeAssetRef;
  region: CreativeRegion;
}
export interface SelectRegionResult {
  asset: CreativeAssetRef;
}

export interface CropObjectParams {
  asset: CreativeAssetRef;
  boundingBox: NormalizedBoundingBox;
}
export interface CropObjectResult {
  asset: CreativeAssetRef;
}

export interface RemoveBackgroundParams {
  asset: CreativeAssetRef;
}
export interface RemoveBackgroundResult {
  asset: CreativeAssetRef;
}

export interface CleanupArtworkParams {
  asset: CreativeAssetRef;
  instruction?: string;
}
export interface CleanupArtworkResult {
  asset: CreativeAssetRef;
}

export interface ReconstructArtworkParams {
  asset: CreativeAssetRef;
  instruction?: string;
}
export interface ReconstructArtworkResult {
  asset: CreativeAssetRef;
}

export interface VectorizeArtworkParams {
  asset: CreativeAssetRef;
}
export interface VectorizeArtworkResult {
  asset: CreativeAssetRef;
}

export interface InspectArtworkParams {
  asset: CreativeAssetRef;
}
export interface InspectArtworkResult {
  metadata: Record<string, unknown>;
}

export interface ExportAssetParams {
  asset: CreativeAssetRef;
  format: string;
}
export interface ExportAssetResult {
  asset: CreativeAssetRef;
}

/**
 * A creative image-processing provider. Implementations back this with a
 * real integration (e.g. Adobe) or an explicit manual/no-op path — never
 * with simulated output.
 */
export interface CreativeProcessingProvider {
  readonly id: string;
  readonly name: string;

  getAvailability(): ProviderAvailability | Promise<ProviderAvailability>;
  getSupportedCapabilities(): CreativeCapability[];

  analyzeImage(
    params: AnalyzeImageParams,
  ): Promise<CreativeOperationResult<AnalyzeImageResult>>;
  selectRegion(
    params: SelectRegionParams,
  ): Promise<CreativeOperationResult<SelectRegionResult>>;
  cropObject(
    params: CropObjectParams,
  ): Promise<CreativeOperationResult<CropObjectResult>>;
  removeBackground(
    params: RemoveBackgroundParams,
  ): Promise<CreativeOperationResult<RemoveBackgroundResult>>;
  cleanupArtwork(
    params: CleanupArtworkParams,
  ): Promise<CreativeOperationResult<CleanupArtworkResult>>;
  reconstructArtwork(
    params: ReconstructArtworkParams,
  ): Promise<CreativeOperationResult<ReconstructArtworkResult>>;
  vectorizeArtwork(
    params: VectorizeArtworkParams,
  ): Promise<CreativeOperationResult<VectorizeArtworkResult>>;
  inspectArtwork(
    params: InspectArtworkParams,
  ): Promise<CreativeOperationResult<InspectArtworkResult>>;
  exportAsset(
    params: ExportAssetParams,
  ): Promise<CreativeOperationResult<ExportAssetResult>>;
}
