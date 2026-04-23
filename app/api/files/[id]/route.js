import fs from "fs";
import { getCurrentUser } from "@/lib/auth";
import { getOrderFileById } from "@/lib/orders";

export async function GET(_request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Необхідна авторизація", { status: 401 });
  }

  const { id } = await params;
  const file = getOrderFileById(id, user);

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
