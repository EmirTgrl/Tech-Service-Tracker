import jsPDF from "jspdf";
import QRCode from "qrcode";
import { DeviceDetail } from "./types";

export const generateDeviceLabel = async (device: DeviceDetail) => {
  try {
    const qrData = device.trackingCode;

    const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1 });

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [80, 50],
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TECHNICAL SERVICE TRACKING", 40, 5, { align: "center" });

    doc.addImage(qrDataUrl, "PNG", 2, 8, 35, 35);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    doc.text(`Kod: ${device.trackingCode}`, 40, 15);

    const brandModel = `${device.brand} ${device.model}`;
    const brandLines = doc.splitTextToSize(brandModel, 38);
    doc.text(brandLines, 40, 20);

    const customerName = device.customer.name;
    const nameLines = doc.splitTextToSize(customerName, 38);
    doc.text(nameLines, 40, 30);

    doc.setFontSize(7);
    doc.text(
      `Date: ${new Date(device.createdAt).toLocaleDateString("tr-TR")}`,
      40,
      45
    );

    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } catch (error) {
    console.error("Label creation error:", error);
    alert("An error occurred while creating the label.");
  }
};
