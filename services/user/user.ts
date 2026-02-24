/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";

export type UpdateMeResponse = {
  success: boolean;
  message?: string | null;
  data?: {
    user?: any;
  };
};

export type UpdateMeData = {
  user?: any;
};

export const updateMe = async (payload: {
  name?: string;
  avatarFile?: File | null;
}): Promise<UpdateMeData> => {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.avatarFile) formData.append("avatar", payload.avatarFile);

  const response = await axios.post<UpdateMeResponse>("/user/update", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // ✅ خروجی: { user?: any }
  return response.data.data ?? {};
};
