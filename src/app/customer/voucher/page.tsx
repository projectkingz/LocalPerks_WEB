"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils/date";

interface Voucher {
  id: string;
  code: string;
  status: string;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  reward: {
    id: string;
    name: string;
    description: string;
    points: number;
  };
  redemption: {
    id: string;
    points: number;
    createdAt: string;
  };
}

export default function CustomerVoucherPage() {
  const { data: session } = useSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/rewards/vouchers");
      if (!response.ok) {
        throw new Error("Failed to fetch vouchers");
      }

      const data = await response.json();
      setVouchers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVouchers();
    setRefreshing(false);
  };

  const handleCancelRedemption = async (voucher: Voucher) => {
    if (
      !confirm(
        "Are you sure you want to cancel this redemption? Points will be recredited."
      )
    )
      return;
    try {
      setLoading(true);
      console.log("Calling cancel API for voucher:", voucher.id);
      const response = await fetch(
        `/api/rewards/vouchers/${voucher.id}/cancel`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to cancel redemption");
      await fetchVouchers(); // Refresh the list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel redemption"
      );
    } finally {
      setLoading(false);
    }
  };

  const getVoucherStatus = (voucher: Voucher) => {
    if (voucher.status === "used") {
      return {
        status: "used",
        label: "Used",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }

    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      return {
        status: "expired",
        label: "Expired",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
      };
    }

    return {
      status: "active",
      label: "Active",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    };
  };

  const downloadQRCode = (voucher: Voucher) => {
    const canvas = document.createElement("canvas");
    const svg = document.querySelector(`#qr-${voucher.id} svg`) as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const link = document.createElement("a");
          link.download = `voucher-${voucher.code}.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Gift className="h-8 w-8 text-blue-600 mr-3" />
              My Vouchers
            </h1>
            <p className="text-gray-600 mt-2">
              Your redeemed rewards and vouchers
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {vouchers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No vouchers yet
            </h3>
            <p className="text-gray-600 mb-6">
              Redeem rewards to get your first voucher
            </p>
            <a
              href="/customer/rewards"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Rewards
            </a>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((voucher, index) => {
              const statusInfo = getVoucherStatus(voucher);
              const StatusIcon = statusInfo.icon;
              const isCancelable =
                statusInfo.status === "active" &&
                (!voucher.expiresAt ||
                  new Date(voucher.expiresAt) > new Date()) &&
                !voucher.usedAt;

              return (
                <motion.div
                  key={voucher.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                    >
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {statusInfo.label}
                    </div>
                    <button
                      onClick={() => downloadQRCode(voucher)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Download QR Code"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Reward Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {voucher.reward.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {voucher.reward.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Redeemed for {voucher.redemption.points} points
                      </span>
                      <span className="font-medium text-gray-900">
                        {voucher.reward.points} pts
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center mb-4">
                    <p className="text-xs text-gray-500 mb-2">Scan QR Code</p>
                    <div
                      id={`qr-${voucher.id}`}
                      className={`p-8 rounded-lg border-2 ${
                        statusInfo.status === "active"
                          ? "border-blue-200 bg-blue-50"
                          : statusInfo.status === "used"
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <QRCodeSVG
                        value={voucher.code}
                        size={240}
                        level="H"
                        className={
                          statusInfo.status !== "active" ? "opacity-50" : ""
                        }
                      />
                    </div>
                  </div>

                  {/* Voucher Code */}
                  <div className="text-center mb-4">
                    <p className="text-xs text-gray-500 mb-2">Voucher Code</p>
                    <div className="bg-yellow-50 px-4 py-3 rounded-lg border-2 border-yellow-300 shadow-sm">
                      <p className="font-mono text-2xl font-bold text-gray-900 tracking-wider break-all">
                        {voucher.code}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatDate(voucher.createdAt)}</span>
                    </div>
                    {voucher.expiresAt && (
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span
                          className={
                            new Date(voucher.expiresAt) < new Date()
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {formatDate(voucher.expiresAt)}
                        </span>
                      </div>
                    )}
                    {voucher.usedAt && (
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{formatDate(voucher.usedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  {statusInfo.status === "active" && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        Show this QR code to the merchant to redeem your reward
                      </p>
                    </div>
                  )}

                  {/* Cancel Redemption Button */}
                  {isCancelable && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log(
                          "Cancel button clicked for voucher:",
                          voucher.id
                        );
                        handleCancelRedemption(voucher);
                      }}
                      className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Redemption
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
