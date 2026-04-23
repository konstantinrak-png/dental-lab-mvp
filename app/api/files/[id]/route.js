import fs from "fs";
import { getOrderFileById } from "@/lib/orders";

export async function GET(_request, { params }) {
  const { id } = await params;
  const file = getOrderFileById(id);

  if (!file || !fs.existsSync(file.file_path)) {
    return new Response("Файл не знайдено", { status: 404 });
  }

  const content = fs.readFileSync(file.file_path);

  return new Response(content, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.original_name)}"`
    }
  });
}
