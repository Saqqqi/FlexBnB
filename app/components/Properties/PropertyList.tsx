'use client'

import { useEffect, useState } from 'react';
import PropertyListItem from "./PropertyListItem";
import apiService from '../services/apiService';

export type PropertyType = {
  id: string;
  title: string;
  image_url: string;
  price_per_night: number;
  price_per_hour?: number;
  is_hourly_booking: boolean;
  available_hours_start?: string;
  available_hours_end?: string;
  allow_room_pooling?: boolean;
} 
const PropertyList=() =>{
  const [properties,setProperties]=useState<PropertyType[]>([]);
  const getProperties= async() =>{
    const tmpProperties=await apiService.get('/api/properties/',null);
    
    setProperties(tmpProperties.data);
  };

  useEffect(() =>{  
    getProperties()
  }, []);
  return (
    <>
        {properties.map((property) => {
            return (
                <PropertyListItem 
                    key={property.id}
                    property={property}
                />
            )
        })}
    </>
   ) 

}
export default PropertyList;

