import Categories from "./components/Categories";
import PropertyList from "./components/Properties/PropertyList";
import { RecommendedProperties, GuestMatchCard } from "./components/Recommendation";

export default function Home() {
  return (
    <main className="max-w-[1550px] mx-auto px-4 pt-6">
      <Categories/>
      
      {/* AI-Powered Recommendations Section */}
      <RecommendedProperties />
      
      {/* Guest Preference Matching */}
      <div className="my-8">
        <GuestMatchCard />
      </div>
      
      {/* All Properties */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <PropertyList/>
        </div>
      </div>
    </main>
  );
}
