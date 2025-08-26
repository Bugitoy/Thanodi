"use client";

import { useEffect } from "react";
import { setupDevErrorHandler } from "@/lib/dev-error-handler";

export default function DevErrorHandler() {
  useEffect(() => {
    setupDevErrorHandler();
  }, []);

  return null; // This component doesn't render anything
}
