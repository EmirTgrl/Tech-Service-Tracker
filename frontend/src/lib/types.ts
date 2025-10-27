export interface DeviceSummary {
  id: number;
  trackingCode: string;
  serialNo: string;
  brand: string;
  model: string;
  currentStatus: "PENDING" | "IN_REPAIR" | "COMPLETED" | "DELIVERED";
  createdAt: string;

  customer: {
    name: string;
    phone: string;
  };

  assignedTechnician: {
    name: string;
  } | null;
}
