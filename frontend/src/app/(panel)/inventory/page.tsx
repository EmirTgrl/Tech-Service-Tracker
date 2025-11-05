"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { InventoryItem } from "@/lib/types";
import AdminGuard from "@/components/AdminGuard";
import Swal from "sweetalert2";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/inventory");
        setItems(response.data);
      } catch (err: unknown) {
        console.error("Inventory fetch error:", err);
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object" &&
          "error" in err.response.data
        ) {
          setError(err.response.data.error as string);
        } else {
          setError("An error occurred while loading the stock list.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleCreateItem = () => {
    Swal.fire({
      title: "Add New Inventory Item",
      html: `
        <input type="text" id="swal-name" class="swal2-input" placeholder="Part Name (ex: iPhone 14 Screen)">
        <input type="text" id="swal-sku" class="swal2-input" placeholder="Stock Code (SKU) (ex: IP14-E KRN)">
        <input type="number" id="swal-quantity" class="swal2-input" placeholder="Stock Quantity (ex: 10)">
        <input type="number" id="swal-sellPrice" class="swal2-input" placeholder="Selling Price (ex: 4500)">
        <input type="number" id="swal-buyPrice" class="swal2-input" placeholder="Purchase Price (Optional)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Add",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const sku = (document.getElementById("swal-sku") as HTMLInputElement)
          .value;
        const quantity = (
          document.getElementById("swal-quantity") as HTMLInputElement
        ).value;
        const sellPrice = (
          document.getElementById("swal-sellPrice") as HTMLInputElement
        ).value;
        const buyPrice = (
          document.getElementById("swal-buyPrice") as HTMLInputElement
        ).value;

        if (!name || !sku || !sellPrice) {
          Swal.showValidationMessage("Name, SKU and Sale Price are required.");
          return false;
        }
        return {
          name,
          sku,
          quantity: parseInt(quantity) || 0,
          sellPrice: parseFloat(sellPrice),
          buyPrice: buyPrice ? parseFloat(buyPrice) : null,
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await api.post("/inventory", result.value);
          setItems((prevItems) => [...prevItems, response.data]);
          Swal.fire(
            "Added!",
            "The stock item has been successfully added.",
            "success"
          );
        } catch (err: unknown) {
          console.error("Item creation error:", err);
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response &&
            err.response.data &&
            typeof err.response.data === "object" &&
            "error" in err.response.data
          ) {
            Swal.fire("Error!", err.response.data.error as string, "error");
          } else {
            Swal.fire("Error!", "Item could not be added.", "error");
          }
        }
      }
    });
  };

  const handleEditItem = (item: InventoryItem) => {
    Swal.fire({
      title: "Edit Stock Item",
      html: `
        <input type="text" id="swal-name" class="swal2-input" value="${
          item.name
        }">
        <input type="text" id="swal-sku" class="swal2-input" value="${
          item.sku
        }">
        <input type="number" id="swal-quantity" class="swal2-input" value="${
          item.quantity
        }">
        <input type="number" id="swal-sellPrice" class="swal2-input" value="${
          item.sellPrice
        }">
        <input type="number" id="swal-buyPrice" class="swal2-input" value="${
          item.buyPrice || ""
        }" placeholder="Purchase Price">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const sku = (document.getElementById("swal-sku") as HTMLInputElement)
          .value;
        const quantityStr = (
          document.getElementById("swal-quantity") as HTMLInputElement
        ).value;
        const sellPriceStr = (
          document.getElementById("swal-sellPrice") as HTMLInputElement
        ).value;
        const buyPriceStr = (
          document.getElementById("swal-buyPrice") as HTMLInputElement
        ).value;

        if (!name || !sku || !sellPriceStr || !quantityStr) {
          Swal.showValidationMessage(
            "Name, SKU, Stock Quantity and Sale Price are mandatory."
          );
          return false;
        }

        const quantity = parseInt(quantityStr);
        const sellPrice = parseFloat(sellPriceStr);
        const buyPrice = buyPriceStr ? parseFloat(buyPriceStr) : null;

        if (isNaN(quantity) || isNaN(sellPrice)) {
          Swal.showValidationMessage(
            "Stock Quantity and Sales Price must be valid numbers."
          );
          return false;
        }

        if (buyPriceStr && isNaN(buyPrice as number)) {
          Swal.showValidationMessage(
            "The Buy Price must be a valid number (or left blank)."
          );
          return false;
        }

        return {
          name,
          sku,
          quantity: quantity,
          sellPrice: sellPrice,
          buyPrice: buyPrice,
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await api.put(`/inventory/${item.id}`, result.value);
          setItems((prevItems) =>
            prevItems.map((i) => (i.id === item.id ? response.data : i))
          );
          Swal.fire("Updated!", "Stock item updated.", "success");
        } catch (err: unknown) {
          console.error("Item update error:", err);
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response &&
            err.response.data &&
            typeof err.response.data === "object" &&
            "error" in err.response.data
          ) {
            Swal.fire("Error!", err.response.data.error as string, "error");
          } else {
            Swal.fire("Error!", "The item could not be updated.", "error");
          }
        }
      }
    });
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Swal.fire({
      title: "Are you sure?",
      text: `"You are about to remove the part named ${item.name} from stock. This part cannot be deleted if it has been used in repairs!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/inventory/${item.id}`);
          setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
          Swal.fire("Deleted!", "Stock item deleted.", "success");
        } catch (err: unknown) {
          console.error("Item deletion error:", err);
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            err.response &&
            typeof err.response === "object" &&
            "data" in err.response &&
            err.response.data &&
            typeof err.response.data === "object" &&
            "error" in err.response.data
          ) {
            Swal.fire("Error!", err.response.data.error as string, "error");
          } else {
            Swal.fire("Error!", "The item could not be deleted.", "error");
          }
        }
      }
    });
  };

  if (isLoading)
    return (
      <div className="text-center text-gray-700">Stock list loading...</div>
    );
  if (error)
    return (
      <div className="rounded-md bg-red-100 p-4 text-center text-red-700">
        {error}
      </div>
    );

  return (
    <AdminGuard>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Stock (Inventory) Management
          </h1>
          <button
            onClick={handleCreateItem}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 cursor-pointer"
          >
            + Add New Part
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Part Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  SKU (Stock Code)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stock Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No items found in stock.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">
                      {item.sellPrice.toFixed(2)} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminGuard>
  );
}
