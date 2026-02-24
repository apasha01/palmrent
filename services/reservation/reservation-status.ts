import axios from "@/lib/axios";

/**
 * ✅ rentCode همان rent_code است (نه id)
 * بک: GET rent/status/{lang}/{code}
 */
export const getRentStatus = async (lang: string, rentCode: string) => {
  try {
    const response = await axios.get(`rent/status/${lang}/${encodeURIComponent(rentCode)}`);
    // شما گفتی بک response.data.data برمی‌گردونه
    return response.data.data;
  } catch (error) {
    console.error("Error fetching rent status:", error);
    throw error;
  }
};
