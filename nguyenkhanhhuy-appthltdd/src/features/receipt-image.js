export async function recognizeReceipt(uri) {
  try {
    const { recognizeText } = await import('expo-ocr-kit');
    return (await recognizeText(uri)).text;
  } catch (error) {
    if (error instanceof Error && /native module.*not available|cannot find native module/i.test(error.message)) {
      throw Object.assign(new Error('Native OCR is unavailable'), { code: 'OCR_UNAVAILABLE' });
    }
    throw error;
  }
}
