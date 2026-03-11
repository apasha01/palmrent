import axios from "@/lib/axios";

export const getBranchSupport = async (locale: string, branchId: number | string) => {
  try {
    const response = await axios.get(`/branch/${branchId}/support`, {
      params: {
        locale,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error("Error fetching branch support:", error);
    throw error;
  }
}