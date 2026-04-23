import { getUserFromRequest } from "@/lib/auth";
import { createOrderWithFiles, listOrders } from "@/lib/orders";

export async function GET(request) {
  const user = getUserFromRequest(request);

  if (!user) {
    return Response.json({ error: "Необхідна авторизація" }, { status: 401 });
  }

  const orders = listOrders(user);
  return Response.json(orders);
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return Response.json(
        { error: "Необхідна авторизація" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const body = {
      clinic_name: formData.get("clinic_name"),
      doctor_name: formData.get("doctor_name"),
      patient_name: formData.get("patient_name"),
      work_type: formData.get("work_type"),
      material: formData.get("material"),
      comment: formData.get("comment"),
      due_date: formData.get("due_date"),
      status: formData.get("status")
    };
    const files = formData
      .getAll("files")
      .filter((file) => file && typeof file.name === "string" && file.size > 0);
    const order = await createOrderWithFiles(body, files, user);

    return Response.json(order, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
