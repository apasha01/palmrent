import Footer from "@/components/Footer";
import Header from "@/components/layouts/Header";

export default function CarsLayout({children}){
    return(
        <>
            <Header/>
            {children}
            <Footer/>
        </>
    )
}