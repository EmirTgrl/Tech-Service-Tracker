import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DeviceDetail } from "./types";
import Swal from "sweetalert2";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generateServiceReport = (device: DeviceDetail) => {
  try {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Technical Service Report", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Tracking Code: ${device.trackingCode}`, 14, 30);
    doc.text(
      `Date of Entry: ${new Date(device.createdAt).toLocaleDateString(
        "tr-TR"
      )}`,
      14,
      36
    );

    autoTable(doc, {
      startY: 45,
      head: [["Customer Information", "Device Information"]],
      body: [
        [
          `Name: ${device.customer.name}\nPhone: ${
            device.customer.phone
          }\nEmail: ${device.customer.email || "-"}`,
          `Device: ${device.deviceType} - ${device.brand} ${device.model}\nSerial Number: ${device.serialNo}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
    });

    let startY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Reported Fault Description", 14, startY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const issueLines = doc.splitTextToSize(device.issueDesc, 180);
    doc.text(issueLines, 14, startY + 6);

    startY += issueLines.length * 5 + 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("List of Operations and Cost Breakdown", 14, startY);

    const tableBody = [
      ...device.partsUsed.map((part) => [
        `PART: ${part.inventoryItem.name} (x${part.quantityUsed})`,
        `${part.sellPriceAtTimeOfUse.toFixed(2)} TL`,
      ]),
      ...device.repairs.map((repair) => [
        `LABOUR COST: ${repair.description}`,
        `${repair.cost.toFixed(2)} TL`,
      ]),
    ];

    autoTable(doc, {
      startY: startY + 6,
      head: [["Description", "Cost"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      didDrawPage: (data) => {
        startY = data.cursor?.y || 0;
      },
    });

    startY += 10;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(
      `TOTAL COST: ${
        device.finalCost ? device.finalCost.toFixed(2) : "0.00"
      } TL`,
      105,
      startY,
      { align: "center" }
    );

    startY += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("I received my device in working order and complete.", 14, startY);

    doc.line(14, startY + 15, 80, startY + 15);
    doc.text("Customer (Name/Surname/Signature)", 14, startY + 20);

    doc.line(130, startY + 15, 196, startY + 15);
    doc.text("Technician (Stamp/Signature)", 130, startY + 20);

    doc.save(`service-report-${device.trackingCode}.pdf`);
  } catch (error) {
    console.error("Error while creating PDF:", error);
    Swal.fire(
      "Error!",
      "An error occurred while generating the PDF report.",
      "error"
    );
  }
};
