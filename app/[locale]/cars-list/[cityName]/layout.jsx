import Footer from '@/components/Footer';
import Header from "@/components/layouts/Header";


export default async function BranchLayout({ children, params }) {
   const { cityName } = await params;

   const cityList = ['dubai', 'istanbul', 'kayseri', 'kish', 'izmir', 'georgia', 'oman', 'samsun', 'antalya', 'ankara'];

   if (!cityList.includes(cityName)) return null;

   return (
      <>
         <Header />
         {children}
         <Footer />
      </>
   );
}
