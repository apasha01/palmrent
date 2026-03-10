import { useQuery } from "@tanstack/react-query";
import { getHubFaq } from "./hub.api";


export const useHubFaq = (locale: string) => {
  return useQuery({
    queryKey: ["hubFaq", locale],
    queryFn: () => getHubFaq(locale),
  });
};