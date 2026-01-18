import Footer from "@/components/Footer";
import Header from "@/components/layouts/Header";

export default async function BranchLayout({ children }) {

  return (
    <>
        <Header shadowLess/>
        { children }
        <Footer/>
    </>
  );
}
