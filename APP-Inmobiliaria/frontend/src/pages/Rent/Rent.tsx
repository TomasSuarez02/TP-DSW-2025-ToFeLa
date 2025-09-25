import Header from "../../components/Header.tsx"
import Grid from "./Grid.tsx"
import Footer from "../../components/Footer.tsx"
// import { useEffect } from "react";

export default function Rent() {
  /* useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      window.location.href = "/login";
    }
  }, []); */

  return (
    <>
      <Header/>
      <div className="bg-gradient-to-t from-[#e4dfd5] to-white min-h-screen">
        <Grid/>
      </div>
      <Footer/>
    </>
  )
}