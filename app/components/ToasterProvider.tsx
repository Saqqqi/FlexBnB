"use client";

import dynamic from "next/dynamic";

const RealToaster = dynamic(() => import("react-hot-toast").then(m => m.Toaster), { ssr: false });

export default function ToasterProvider() {
  return <RealToaster />;
} 