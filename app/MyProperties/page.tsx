import Image from "next/image";
import PropertyList from "../components/Properties/PropertyList";

const MyPropertiesPage=()=>{
    return(
        <main className="max-w[1500px] mx-auto pv-6 pb-6 pt-4">
           <div className="mt-4 grid grid-cols-1 md:grid-cols-3  gap-6">
                            <PropertyList/>
                        </div>
        </main>
    )
}
export default MyPropertiesPage;
