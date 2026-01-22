
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MigrationPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/owner/dashboard");
  }, [router]);

  return null;
}
