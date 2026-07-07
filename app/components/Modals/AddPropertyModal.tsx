'use client';

import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useState, ChangeEvent } from "react";
import Categories from "../addproperty/Category";
import apiService from "../services/apiService";
import Modals from "./Modals";
import { useRouter } from "next/navigation";
import UseAddPropertyModal from "@/app/Hooks/UseAddPropertyModal";
import CustomButton from "../Forms/CustomButton";
import SelectCountry, { SelectCountryValue } from "../Forms/SelectCountry";
import toast from 'react-hot-toast';
import PropertyMap from '../Maps/PropertyMap';
import { XMarkIcon, StarIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ImageWithPreview {
  file: File;
  preview: string;
  isPrimary: boolean;
}

const AddPropertyModal = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dataCategory, setDataCategory] = useState("");
  const [dataTitle, setDataTitle] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [dataPrice, setDataPrice] = useState("");
  const [dataPricePerHour, setDataPricePerHour] = useState("");
  const [isHourlyBooking, setIsHourlyBooking] = useState(false);
  const [availableHoursStart, setAvailableHoursStart] = useState("");
  const [availableHoursEnd, setAvailableHoursEnd] = useState("");
  const [dataBedrooms, setDataBedrooms] = useState("");
  const [dataBathrooms, setDataBathrooms] = useState("");
  const [dataGuests, setDataGuests] = useState("");
  const [dataCountry, setDataCountry] = useState<SelectCountryValue>();
  const [allowRoomPooling, setAllowRoomPooling] = useState(false);
  const [maxPoolMembers, setMaxPoolMembers] = useState("6");
  const [dataImages, setDataImages] = useState<ImageWithPreview[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const addPropertyModal = UseAddPropertyModal();
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();

  const setCategory = (category: string) => setDataCategory(category);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newImages: ImageWithPreview[] = Array.from(event.target.files).map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: dataImages.length === 0 && index === 0, // First image is primary if no images exist
      }));
      
      setDataImages(prev => [...prev, ...newImages]);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setDataImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // If removed image was primary and there are still images, make first one primary
      if (prev[index].isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      // Clean up the preview URL
      URL.revokeObjectURL(prev[index].preview);
      return newImages;
    });
  };

  const setPrimaryImage = (index: number) => {
    setDataImages(prev => 
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    );
  };

  const submitForm = async () => {
    if (!isSignedIn) {
      toast.error('You must be signed in to add a property.');
      return;
    }

    try {
      console.log('Starting form submission...');
      
      const token = await getToken({
        template: 'flexbnb_property_api'
      });
      
      if (!token) {
        toast.error('Authentication failed. Please try signing in again.');
        return;
      }

      // Validate required fields
      if (!dataCountry || dataImages.length === 0) {
        toast.error('Please fill in all required fields including at least one image');
        return;
      }

      const requiredFields = {
        category: dataCategory,
        title: dataTitle,
        description: dataDescription,
        price: dataPrice,
        country: dataCountry.label,
      };

      if (isHourlyBooking) {
        if (!dataPricePerHour || !availableHoursStart || !availableHoursEnd) {
          toast.error('Please fill in all hourly booking fields');
          return;
        }
      }

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const formData = new FormData();
      formData.append('category', dataCategory);
      formData.append('title', dataTitle);
      formData.append('description', dataDescription);
      formData.append('price_per_night', dataPrice);
      formData.append('price_per_hour', dataPricePerHour);
      formData.append('is_hourly_booking', isHourlyBooking.toString());
      formData.append('available_hours_start', availableHoursStart);
      formData.append('available_hours_end', availableHoursEnd);
      formData.append('bedrooms', dataBedrooms || '0');
      formData.append('bathrooms', dataBathrooms || '0');
      formData.append('guests', dataGuests || '0');
      formData.append('country', dataCountry.label);
      formData.append('country_code', dataCountry.value);
      formData.append('latitude', latitude?.toString() || '');
      formData.append('longitude', longitude?.toString() || '');
      formData.append('allow_room_pooling', allowRoomPooling.toString());
      formData.append('max_pool_members', allowRoomPooling ? maxPoolMembers : '6');

      // Find and append the primary image first (as the legacy 'image' field)
      const primaryImage = dataImages.find(img => img.isPrimary) || dataImages[0];
      formData.append('image', primaryImage.file);

      // Append all images for the new multiple images feature
      // Sort so primary image comes first
      const sortedImages = [...dataImages].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return 0;
      });
      
      sortedImages.forEach((img) => {
        formData.append('images', img.file);
      });

      console.log('Submitting to API with', dataImages.length, 'images...');
      const response = await apiService.post('/api/properties/create/', formData, token);
      console.log('API Response:', response);

      if (response.success) {
        toast.success(response.message || 'Property added successfully!');
        // Clean up preview URLs
        dataImages.forEach(img => URL.revokeObjectURL(img.preview));
        setDataImages([]);
        router.refresh();
        addPropertyModal.close();
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, error]) => {
            const errorMessage = Array.isArray(error) ? error.join(', ') : String(error);
            toast.error(`${field}: ${errorMessage}`);
          });
        } else {
          toast.error(response.message || 'Failed to add property');
        }
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      
      if (err.status === 401 || err.status === 403) {
        toast.error('Authentication failed. Please sign in again.');
      } else if (err.errors) {
        Object.entries(err.errors).forEach(([field, error]) => {
          const errorMessage = Array.isArray(error) ? error.join(', ') : String(error);
          toast.error(`${field}: ${errorMessage}`);
        });
      } else {
        toast.error(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const content = (
    <div className="max-h-[80vh] overflow-y-auto">
      {currentStep === 1 ? (
        <>
          <h2 className="mb-6 text-2xl">Choose Category</h2>
          <Categories dataCategory={dataCategory} setCategory={setCategory} />
          <CustomButton label="Next" onClick={() => setCurrentStep(2)} />
        </>
      ) : currentStep === 2 ? (
        <>
          <h2 className="mb-6 text-2xl">Describe Your Place</h2>
          <div className="pt-3 pb-6 space-y-4">
            <div className="flex flex-col space-y-2">
              <label>Title</label>
              <input
                type="text"
                value={dataTitle}
                onChange={(e) => setDataTitle(e.target.value)}
                className="w-full p-4 border border-gray-600 rounded-xl"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label>Description</label>
              <textarea
                value={dataDescription}
                onChange={(e) => setDataDescription(e.target.value)}
                className="w-full p-4 border border-gray-600 rounded-xl"
              />
            </div>
          </div>
          <CustomButton label="Previous" className="!mb-2 !bg-black hover:!bg-gray-800" onClick={() => setCurrentStep(1)} />
          <CustomButton label="Next" onClick={() => setCurrentStep(3)} />
        </>
      ) : currentStep === 3 ? (
        <>
          <h2 className="mb-6 text-2xl">Details</h2>
          <div className="pt-3 pb-6 space-y-4">
            <div className="flex flex-col space-y-2">
              <label>Price Per Night</label>
              <input
                type="number"
                value={dataPrice}
                onChange={(e) => setDataPrice(e.target.value)}
                className="w-full h-[20px] p-4 border border-gray-600 rounded-xl"
              />
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="hourlyBooking"
                checked={isHourlyBooking}
                onChange={(e) => setIsHourlyBooking(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="hourlyBooking">Enable Hourly Booking</label>
            </div>
            {isHourlyBooking && (
              <>
                <div className="flex flex-col space-y-2">
                  <label>Price Per Hour</label>
                  <input
                    type="number"
                    value={dataPricePerHour}
                    onChange={(e) => setDataPricePerHour(e.target.value)}
                    className="w-full h-[20px] p-4 border border-gray-600 rounded-xl"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label>Available Hours Start</label>
                  <input
                    type="time"
                    value={availableHoursStart}
                    onChange={(e) => setAvailableHoursStart(e.target.value)}
                    className="w-full h-[20px] p-4 border border-gray-600 rounded-xl"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label>Available Hours End</label>
                  <input
                    type="time"
                    value={availableHoursEnd}
                    onChange={(e) => setAvailableHoursEnd(e.target.value)}
                    className="w-full h-[20px] p-4 border border-gray-600 rounded-xl"
                  />
                </div>
              </>
            )}
            {['Bedrooms', 'Bathrooms', 'Guests'].map((label, index) => {
              const stateSetters = [setDataBedrooms, setDataBathrooms, setDataGuests];
              const values = [dataBedrooms, dataBathrooms, dataGuests];
              return (
                <div key={label} className="flex flex-col space-y-2">
                  <label>{label}</label>
                  <input
                    type="number"
                    value={values[index]}
                    onChange={(e) => stateSetters[index](e.target.value)}
                    className="w-full h-[20px] p-4 border border-gray-600 rounded-xl"
                  />
                </div>
              );
            })}
            
            {/* Room Pooling Settings */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🏠 Room Pooling Settings
              </h3>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="allowRoomPooling"
                  checked={allowRoomPooling}
                  onChange={(e) => setAllowRoomPooling(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="allowRoomPooling">Allow guests to create shared room pools</label>
              </div>
              {allowRoomPooling && (
                <div className="flex flex-col space-y-2 ml-6 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    Room pooling allows multiple guests to share this property and split costs.
                  </p>
                  <label>Maximum Pool Members</label>
                  <input
                    type="number"
                    value={maxPoolMembers}
                    onChange={(e) => setMaxPoolMembers(e.target.value)}
                    min="2"
                    max="20"
                    className="w-full h-[20px] p-4 border border-gray-300 rounded-xl"
                  />
                  <p className="text-xs text-gray-500">
                    Set the maximum number of guests that can join a room pool (2-20)
                  </p>
                </div>
              )}
            </div>
          </div>
          <CustomButton label="Previous" className="!mb-2 !bg-black hover:!bg-gray-800" onClick={() => setCurrentStep(2)} />
          <CustomButton label="Next" onClick={() => setCurrentStep(4)} />
        </>
      ) : currentStep === 4 ? (
        <>
          <h2 className="mb-6 text-2xl">Location</h2>
          <div className="pt-3 pb-6 space-y-4">
            <SelectCountry value={dataCountry} onChange={(value) => setDataCountry(value as SelectCountryValue)} />
            <div className="mt-4">
              <label className="block mb-2">Pin Location on Map</label>
              <PropertyMap
                onLocationSelect={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                initialLat={latitude || undefined}
                initialLng={longitude || undefined}
              />
            </div>
          </div>
          <CustomButton label="Previous" className="!mb-2 !bg-black hover:!bg-gray-800" onClick={() => setCurrentStep(3)} />
          <CustomButton label="Next" onClick={() => setCurrentStep(5)} />
        </>
      ) : (
        <>
          <h2 className="mb-6 text-2xl">Property Images</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload multiple images of your property. The first image (or one you mark with a star) will be the primary image shown in listings.
          </p>
          <div className="pt-3 pb-6 space-y-4">
            {/* Upload Button */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <PhotoIcon className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (max 10MB each)</p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </label>

            {/* Image Previews Grid */}
            {dataImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {dataImages.length} image{dataImages.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-gray-500">
                    Click ⭐ to set as primary
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dataImages.map((img, index) => (
                    <div 
                      key={index} 
                      className={`relative group rounded-xl overflow-hidden border-2 ${
                        img.isPrimary ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="aspect-square relative">
                        <Image
                          fill
                          alt={`Property image ${index + 1}`}
                          src={img.preview}
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {/* Set as Primary */}
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className={`p-2 rounded-full ${
                            img.isPrimary 
                              ? 'bg-indigo-500 text-white' 
                              : 'bg-white text-gray-700 hover:bg-indigo-100'
                          }`}
                          title={img.isPrimary ? 'Primary image' : 'Set as primary'}
                        >
                          {img.isPrimary ? (
                            <StarIconSolid className="w-5 h-5" />
                          ) : (
                            <StarIcon className="w-5 h-5" />
                          )}
                        </button>
                        
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-2 rounded-full bg-white text-red-600 hover:bg-red-100"
                          title="Remove image"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Primary Badge */}
                      {img.isPrimary && (
                        <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <StarIconSolid className="w-3 h-3" />
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dataImages.length === 0 && (
              <p className="text-center text-sm text-amber-600 py-4">
                Please upload at least one image of your property
              </p>
            )}
          </div>
          <CustomButton label="Previous" className="!mb-2 !bg-black hover:!bg-gray-800" onClick={() => setCurrentStep(4)} />
          <CustomButton 
            label="Submit Property" 
            onClick={submitForm}
            className={dataImages.length === 0 ? '!bg-gray-400 !cursor-not-allowed' : ''}
          />
        </>
      )}
    </div>
  );

  return (
    <Modals
      isOpen={addPropertyModal.isOpen}
      close={addPropertyModal.close}
      label="Add Property"
      Content={content}
    />
  );
};

export default AddPropertyModal;

