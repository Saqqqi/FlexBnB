'use client';

import React from 'react';
import UseCountries from '@/app/Hooks/UseCountries';

export type SelectCountryValue = {
  label: string;
  value: string;
};

interface SelectCountryProps {
  value?: SelectCountryValue;
  onChange: (value: SelectCountryValue) => void;
}

const SelectCountry: React.FC<SelectCountryProps> = ({
  value,
  onChange
}) => {
  const { getAll } = UseCountries();
  const countries = getAll();

  return (
    <div className="w-full">
      <select
        value={value?.value || ''}
        onChange={(e) => {
          const selected = countries.find(c => c.value === e.target.value);
          if (selected) {
            onChange(selected);
          }
        }}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="" disabled>Select a country</option>
        {countries.map((country) => (
          <option key={country.value} value={country.value}>
            {country.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectCountry;
