// Deprecated: External provider-specific artifact creation removed in simplified upload-only model.
// This file intentionally left as a no-op to preserve import stability; remove in a future cleanup.
export interface CreatePandadocArtifactInput { /* deprecated */ }
export async function createPandadocArtifact(): Promise<null> { return null }
export async function updatePandadocArtifactStatus(): Promise<null> { return null }
export async function listPandadocArtifactsForEngagement(): Promise<[]> { return [] }
