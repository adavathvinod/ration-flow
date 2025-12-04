import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QRCodeDisplayProps {
  shopCode: string;
  shopName?: string;
}

const QRCodeDisplay = ({ shopCode, shopName }: QRCodeDisplayProps) => {
  const [open, setOpen] = useState(false);

  // Generate the URL that customers will scan
  const queueUrl = `${window.location.origin}/?code=${shopCode}`;

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 480;
      
      if (ctx) {
        // White background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 50, 40, 300, 300);
        
        // Add text
        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(shopName || "Scan to Join Queue", canvas.width / 2, 380);
        
        ctx.font = "18px monospace";
        ctx.fillStyle = "#666";
        ctx.fillText(`Code: ${shopCode}`, canvas.width / 2, 420);
        
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#999";
        ctx.fillText("QueueToken", canvas.width / 2, 460);
      }

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `queue-${shopCode}.png`;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share Your Queue</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-white p-4 rounded-xl shadow-inner">
            <QRCodeSVG
              id="qr-code-svg"
              value={queueUrl}
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">{shopName || "Your Queue"}</p>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              Code: {shopCode}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button onClick={handleDownload} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Print this QR code and display it for customers to scan and join your queue
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;
