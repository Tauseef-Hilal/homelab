"use client";

import useAuthStore from "@client/features/auth/stores/auth.store";
import { useMe } from "@client/hooks/useMe";
import { useEffect } from "react";

function Me() {
  const { setUser } = useAuthStore();
  const { data, error, refetch } = useMe();

  useEffect(() => {
    if (data) {
      setUser(data.user);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      refetch();
    }
  }, [error]);

  return <div></div>;
}

export default Me;
