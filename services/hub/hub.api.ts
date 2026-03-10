import axios from "@/lib/axios";

/**
 * Fetch Hub FAQ + description
 * GET /hub/index?locale=fa
 */
export const getHubFaq = async (locale: string) => {
  try {
    const response = await axios.get(`/hub/index`, {
      params: {
        locale,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error("Error fetching hub faq:", error);
    throw error;
  }
};