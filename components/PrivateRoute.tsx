"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function PrivateRoute({ allowedRoles, children }: Props) {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!role || !allowedRoles.includes(role)) {
      router.push("/login");
    }
  }, [role, isLoading]);

  if (isLoading) return null;
  if (!role || !allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
