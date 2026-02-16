"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface Address {
  street: string;
  city: string;
  postalCode: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: Address) => void;
  placeholder?: string;
  className?: string;
}

interface BanFeature {
  properties: {
    label: string;
    name: string;
    city: string;
    postcode: string;
    context: string;
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher une adresse...",
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // API Base Adresse Nationale (gratuite, française)
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Erreur recherche adresse:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    // Debounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchAddress(val);
    }, 300);
  };

  const handleSelectSuggestion = (feature: BanFeature) => {
    const address: Address = {
      street: feature.properties.name,
      city: feature.properties.city,
      postalCode: feature.properties.postcode,
    };
    onChange(feature.properties.name);
    onSelect(address);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900 ${className}`}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((feature, index) => (
            <button
              key={feature.properties.label}
              type="button"
              onClick={() => handleSelectSuggestion(feature)}
              className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                index === selectedIndex
                  ? "bg-stone-100"
                  : "hover:bg-stone-50"
              }`}
            >
              <MapPin size={16} className="mt-0.5 shrink-0 text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {feature.properties.name}
                </p>
                <p className="text-xs text-stone-500">
                  {feature.properties.postcode} {feature.properties.city}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
