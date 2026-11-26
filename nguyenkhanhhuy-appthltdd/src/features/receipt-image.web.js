export async function recognizeReceipt(uri) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['eng', 'vie']);
  try {
    const result = await worker.recognize(uri);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}
