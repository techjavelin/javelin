// Deprecated legacy seeding entrypoint retained for backward compatibility.
// Use the migrations framework instead (see ../migrations).
// Intentionally no-op; first migration (001) seeds default metadata.
export async function seedDefaultMetadata() {
  // eslint-disable-next-line no-console
  console.warn('[seed] seedDefaultMetadata() is deprecated. Migrations now handle default metadata.');
}
