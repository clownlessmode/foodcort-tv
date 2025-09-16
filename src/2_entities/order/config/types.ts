export enum ORDERS_STATUS {
  NEW = "new",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DELIVERED = "delivered",
}

export interface OrderEntity {
  id: number;
  orderId: number;
  status: ORDERS_STATUS;
  phone_number: string;
  id_store: number;
  created_at: Date;
  completed_at: Date | null;
  handed_over_at: Date | null;
}
