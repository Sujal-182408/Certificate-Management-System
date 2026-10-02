import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ShieldCheck } from "lucide-react";

export default function QRCodeDisplay({ verificationUrl }) {
  const [qrImage, setQrImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function generateQR() {
      try {
        setError("");

        const image = await QRCode.toDataURL(verificationUrl, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#0b1120",
            light: "#ffffff",
          },
        });

        if (!cancelled) setQrImage(image);
      } catch {
        if (!cancelled) setError("Could not generate the QR code.");
      }
    }

    generateQR();

    return () => {
      cancelled = true;
    };
  }, [verificationUrl]);

  function downloadQR() {
    if (!qrImage) return;

    const link = document.createElement("a");
    link.href = qrImage;
    link.download = "certificate-qr.png";
    link.click();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-400/10 p-3 text-cyan-300">
          <ShieldCheck size={23} />
        </div>

        <div>
          <h3 className="font-semibold text-white">Your QR certificate</h3>
          <p className="text-sm text-slate-400">
            Scan to open the verification page.
          </p>
        </div>
      </div>

      <div className="my-6 flex min-h-72 items-center justify-center rounded-xl bg-white p-4">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : qrImage ? (
          <img
            src={qrImage}
            alt="Certificate verification QR code"
            className="h-auto w-full max-w-70"
          />
        ) : (
          <p className="text-sm text-slate-500">Generating QR code...</p>
        )}
      </div>

      <button
        onClick={downloadQR}
        disabled={!qrImage}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-40"
      >
        <Download size={17} />
        Download QR Code
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        Certificate validity must be confirmed by the server. A QR image alone
        is not proof that a certificate is valid.
      </p>
    </div>
  );
}