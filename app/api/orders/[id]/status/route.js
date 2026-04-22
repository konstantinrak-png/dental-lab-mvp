import { updateOrderStatus } from "@/lib/orders";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const order = updateOrderStatus(params.id, body.status);
    return Response.json(order);
  } catch (error) {
    const status = error.message === "Order not found" ? 404 : 400;
    return Response.json({ error: error.message }, { status });
  }
}
