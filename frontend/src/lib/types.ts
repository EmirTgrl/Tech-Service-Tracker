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

export interface PaginatedDevicesResponse {
  data: DeviceSummary[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface Repair {
  id: number;
  description: string;
  cost: number;
  createdAt: string;
}

export interface StatusLog {
  id: number;
  newStatus: "PENDING" | "IN_REPAIR" | "COMPLETED" | "DELIVERED";
  notes: string | null;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface DeviceImage {
  id: number;
  imageUrl: string;
  description: string | null;
  uploadedAt: string;
}

export interface DeviceDetail {
  id: number;
  trackingCode: string;
  serialNo: string;
  brand: string;
  model: string;
  deviceType: string;
  issueDesc: string;
  currentStatus: "PENDING" | "IN_REPAIR" | "COMPLETED" | "DELIVERED";
  estimatedCost: number | null;
  finalCost: number | null;
  createdAt: string;
  uploadedAt: string;

  customer: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
  };

  assignedTechnician: {
    id: number;
    name: string;
    email: string;
  } | null;

  statusHistory: StatusLog[];
  repairs: Repair[];
  images: DeviceImage[];
  partsUsed: PartUsage[];
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "TECHNICIAN";
  isActive: boolean;
  createdAt: string;
}

export interface CustomerTrackInfo {
  trackingCode: string;
  currentStatus: "PENDING" | "IN_REPAIR" | "COMPLETED" | "DELIVERED";
  issueDesc: string;
  createdAt: string;
  estimatedCost: number | null;
  customer: {
    name: string;
    phone: string;
  };
  statusHistory: {
    newStatus: string;
    notes: string | null;
    createdAt: string;
  }[];
  repairs: {
    cost: number;
  }[];
}

export interface DashboardStats {
  deviceStats: {
    PENDING: number;
    IN_REPAIR: number;
    COMPLETED: number;
    DELIVERED: number;
  };
  totalCustomers: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  buyPrice: number | null;
  sellPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartUsage {
  id: number;
  quantityUsed: number;
  sellPriceAtTimeOfUse: number;
  createdAt: string;
  inventoryItem: {
    name: string;
    sku: string;
  };
}

export interface CustomerSummary {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    devices: number;
  };
}

export interface PaginatedCustomersResponse {
  data: CustomerSummary[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}
