import Footer from "@/components/Footer";
import Header from "@/components/layouts/Header";

export const metadata = {
  title: "گالری تصاویر - پالم رنت",
  description: "گالری تصاویر",
};

export default function GalleryLayout({children}){
    return(
        <>
            <Header/>
            {children}
            <Footer/>
        </>
    )
} 