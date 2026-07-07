import Image from "next/image";
import { PropertyType } from "./PropertyList";
import { useRouter } from "next/navigation";
import { ClockIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface PropertyProps {
    property: PropertyType,
}

const PropertyListItem: React.FC<PropertyProps> = ({
    property,
}) => {
    const router = useRouter();

    return (
        <div 
            className="cursor-pointer group"
            onClick={() => router.push(`/Properties/${property.id}`)}
        >
            <div className="relative overflow-hidden aspect-square rounded-xl">
                <Image
                    fill
                    src={property.image_url}
                    sizes="(max-width: 768px) 768px, (max-width: 1200px): 768px, 768px"
                    className="group-hover:scale-110 object-cover transition-transform duration-300 h-full w-full"
                    alt={property.title}
                />
                
                {/* Badges on image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                    {property.is_hourly_booking && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-medium shadow-sm">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Hourly
                        </span>
                    )}
                    {property.allow_room_pooling && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-medium shadow-sm">
                            <UserGroupIcon className="w-3.5 h-3.5" />
                            Room Pool
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-2">
                <p className="text-lg font-bold line-clamp-1">{property.title}</p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-500">
                    <strong className="text-gray-900">${property.price_per_night}</strong> per night
                </p>
                {property.is_hourly_booking && property.price_per_hour && (
                    <span className="text-sm text-gray-400">
                        • ${property.price_per_hour}/hr
                    </span>
                )}
            </div>
        </div>
    )
}

export default PropertyListItem;
