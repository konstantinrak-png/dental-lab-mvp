import { createOrder, listOrders } from "@/lib/orders";

export async function GET() {
  const orders = listOrders();
  return Response.json(orders);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const order = createOrder(body);
    return Response.json(order, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
