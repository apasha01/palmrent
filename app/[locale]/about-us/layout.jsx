import Footer from "@/components/Footer";


// export const metadata = {
//   title: "درباره پالم رنت",
//   description: "مجله",
// };

export default function AboutUsLayout({children}){
    return(
        <>
            <Header/>
            {children}
            <Footer/>
        </>
    )
} 