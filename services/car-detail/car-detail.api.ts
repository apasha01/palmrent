// /* eslint-disable @typescript-eslint/no-explicit-any */
// import axios from "@/lib/axios";

// export async function getCarDetail(id: number | string, locale: string) {
//   const url = `/car/show/${id}/${locale}`;
//   const res = await axios.get(url);

//   // خروجی: { status: 200, data: {...} }
//   return res.data?.data;
// }


/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";

export async function getCarDetail(
  id: number | string,
  locale: string
) {
  const url = `/car/show/${id}/${locale}`;
  const res = await axios.get(url);

  // خروجی بک: { status: 200, data: {...} }
  return res.data?.data;
}
