import RobotoRegularUrl from "@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf?url";
import RobotoBoldUrl from "@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf?url";
import type jsPDF from "jspdf";

let cache: { reg: string; bold: string } | null = null;

async function toBase64(url: string): Promise<string> {
  const buf = await (await fetch(url)).arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export async function ensurePdfFonts(doc: jsPDF): Promise<void> {
  if (!cache) {
    const [reg, bold] = await Promise.all([toBase64(RobotoRegularUrl), toBase64(RobotoBoldUrl)]);
    cache = { reg, bold };
  }
  doc.addFileToVFS("Roboto-Regular.ttf", cache.reg);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", cache.bold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
}

export const PDF_FONT = "Roboto";
