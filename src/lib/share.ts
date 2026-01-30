interface ShareData {
  testName: string;
  score: string;
  bestScore?: string;
}

export function formatShareText(data: ShareData): string {
  let text = `Baseline | ${data.testName}: ${data.score}`;
  if (data.bestScore && data.bestScore !== data.score) {
    text += ` (Best: ${data.bestScore})`;
  }
  text += `\n\nhttps://baseline-three-rho.vercel.app`;
  return text;
}

export async function shareResult(data: ShareData): Promise<boolean> {
  const text = formatShareText(data);

  // Try Web Share API first (mobile friendly)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "Baseline Result",
        text,
      });
      return true;
    } catch {
      // User cancelled or error - fall through to clipboard
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
