import axios from "@/utils/axios";

export const getRentStatus = async (lang:string, rentId:string) => {
    try {
        const response = await axios.get(`rent/status/${lang}/${rentId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching rent status:', error);
        throw error;
    }
};
