import { jsPDF } from "jspdf";

const PAGE = {
    width: 210,
    height: 297,
    margin: 10
};

export const downloadTutoringPdf = async (element, fileName) => {
    if (!element) throw new Error("Tutoring document is not available.");

    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        windowWidth: Math.max(element.scrollWidth, 900)
    });

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
    });
    const contentWidth = PAGE.width - (PAGE.margin * 2);
    const contentHeight = PAGE.height - (PAGE.margin * 2);
    const imageHeight = (canvas.height * contentWidth) / canvas.width;
    const image = canvas.toDataURL("image/png");
    const pageCount = Math.max(1, Math.ceil(imageHeight / contentHeight));

    for (let page = 0; page < pageCount; page += 1) {
        if (page > 0) doc.addPage();
        doc.addImage(
            image,
            "PNG",
            PAGE.margin,
            PAGE.margin - (page * contentHeight),
            contentWidth,
            imageHeight,
            undefined,
            "FAST"
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`${page + 1} / ${pageCount}`, PAGE.width - PAGE.margin, PAGE.height - 4, {
            align: "right"
        });
    }

    doc.save(fileName);
};
