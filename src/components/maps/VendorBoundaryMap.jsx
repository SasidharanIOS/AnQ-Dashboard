import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Check,
  Crosshair,
  LoaderCircle,
  LocateFixed,
  Lock,
  MapPin,
  Move,
  Navigation,
  RotateCcw,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

const DEFAULT_MAP_CENTER = {
  lat: Number(import.meta.env.VITE_GOOGLE_MAPS_DEFAULT_LAT || 54.5),
  lng: Number(import.meta.env.VITE_GOOGLE_MAPS_DEFAULT_LNG || -3.5),
};

const MAP_COUNTRIES = String(import.meta.env.VITE_GOOGLE_MAPS_COUNTRIES || "gb")
  .split(",")
  .map((country) => country.trim().toLowerCase())
  .filter(Boolean);

const MAP_LANGUAGE = import.meta.env.VITE_GOOGLE_MAPS_LANGUAGE || "en-GB";

const MAP_REGION = String(import.meta.env.VITE_GOOGLE_MAPS_REGION || "uk")
  .trim()
  .toLowerCase();

const GOOGLE_MAPS_SCRIPT_ID = "anq-google-maps-script";

let googleMapsLoadPromise = null;

const normalizePoints = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => ({
      lat: Number(point?.lat),
      lng: Number(point?.lng),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng) &&
        point.lat >= -90 &&
        point.lat <= 90 &&
        point.lng >= -180 &&
        point.lng <= 180,
    );
};

const pointsAreEqual = (first, second) => {
  return (
    JSON.stringify(normalizePoints(first)) ===
    JSON.stringify(normalizePoints(second))
  );
};

const toPlainLocation = (location) => {
  if (!location) {
    return null;
  }

  const lat =
    typeof location.lat === "function" ? location.lat() : Number(location.lat);

  const lng =
    typeof location.lng === "function" ? location.lng() : Number(location.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat: Number(lat.toFixed(7)),
    lng: Number(lng.toFixed(7)),
  };
};

const normalizeLocationValue = (value) => {
  if (!value) {
    return null;
  }

  const position = toPlainLocation(value);

  if (!position) {
    return null;
  }

  return {
    ...value,
    lat: position.lat,
    lng: position.lng,
    displayName: value.displayName || "Selected location",
    formattedAddress:
      value.formattedAddress || `${position.lat}, ${position.lng}`,
  };
};

const sameLocation = (first, second) => {
  const normalizedFirst = normalizeLocationValue(first);
  const normalizedSecond = normalizeLocationValue(second);

  if (!normalizedFirst || !normalizedSecond) {
    return normalizedFirst === normalizedSecond;
  }

  return (
    normalizedFirst.lat === normalizedSecond.lat &&
    normalizedFirst.lng === normalizedSecond.lng &&
    normalizedFirst.formattedAddress === normalizedSecond.formattedAddress
  );
};

const getAddressComponent = (components, type) => {
  if (!Array.isArray(components)) {
    return "";
  }

  const component = components.find(
    (item) => Array.isArray(item?.types) && item.types.includes(type),
  );

  return (
    component?.longText ||
    component?.long_name ||
    component?.shortText ||
    component?.short_name ||
    ""
  );
};

const getFormattableText = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value.text === "string") {
    return value.text;
  }

  if (typeof value.toString === "function") {
    const text = value.toString();

    return text === "[object Object]" ? "" : text;
  }

  return "";
};

const getGoogleErrorMessage = (error) => {
  const originalMessage = String(
    error?.message || error?.status || error || "",
  );

  const normalized = originalMessage.toLowerCase();

  if (
    normalized.includes("api_key_service_blocked") ||
    normalized.includes("api key service blocked") ||
    normalized.includes("api target blocked") ||
    normalized.includes("apitargetblocked") ||
    normalized.includes("places.autocompleteplaces are blocked")
  ) {
    return "Places API (New) is blocked for this API key. Allow Places API (New) in the key's API restrictions and save the key.";
  }

  if (
    normalized.includes("not activated") ||
    normalized.includes("apinotactivated")
  ) {
    return "Places API (New) is not enabled for this Google Cloud project.";
  }

  if (normalized.includes("referer") || normalized.includes("referrer")) {
    return "This website URL is not allowed in the Google Maps API key restrictions.";
  }

  if (normalized.includes("billing")) {
    return "Google Maps billing is not enabled for this project.";
  }

  if (
    normalized.includes("request_denied") ||
    normalized.includes("permission_denied") ||
    normalized.includes("denied")
  ) {
    return "Google rejected the request. Check Places API (New), Geocoding API, billing and API key restrictions.";
  }

  return (
    originalMessage ||
    "Google Maps request failed. Check the browser console and API key configuration."
  );
};

const reverseGeocodePosition = (maps, position) => {
  return new Promise((resolve, reject) => {
    const geocoder = new maps.Geocoder();

    geocoder.geocode(
      {
        location: position,
      },
      (results, status) => {
        if (status === "OK" && results?.length) {
          resolve(results[0]);
          return;
        }

        reject(
          new Error(
            status === "ZERO_RESULTS"
              ? "No address was found for the adjusted pin location."
              : `Reverse geocoding failed: ${status}`,
          ),
        );
      },
    );
  });
};

const buildDraggedPlaceData = (result, position, previousPlace) => {
  const components =
    result?.address_components || result?.addressComponents || [];

  const formattedAddress =
    result?.formatted_address ||
    result?.formattedAddress ||
    previousPlace?.formattedAddress ||
    `${position.lat}, ${position.lng}`;

  const locality =
    getAddressComponent(components, "postal_town") ||
    getAddressComponent(components, "locality") ||
    previousPlace?.locality ||
    "";

  const administrativeArea =
    getAddressComponent(components, "administrative_area_level_2") ||
    getAddressComponent(components, "administrative_area_level_1") ||
    previousPlace?.administrativeArea ||
    "";

  const displayName =
    getAddressComponent(components, "premise") ||
    getAddressComponent(components, "route") ||
    locality ||
    formattedAddress.split(",")[0] ||
    previousPlace?.displayName ||
    "Adjusted location";

  return {
    ...previousPlace,
    placeId:
      result?.place_id || result?.placeId || previousPlace?.placeId || null,
    displayName,
    formattedAddress,
    postcode:
      getAddressComponent(components, "postal_code") ||
      previousPlace?.postcode ||
      "",
    locality,
    administrativeArea,
    country:
      getAddressComponent(components, "country") ||
      previousPlace?.country ||
      "",
    lat: position.lat,
    lng: position.lng,
    isAdjusted: true,
  };
};

const loadGoogleMaps = (apiKey) => {
  if (window.google?.maps?.Map && window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error("VITE_GOOGLE_MAPS_API_KEY is missing"));
      return;
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    if (existingScript) {
      const resolveExistingScript = () => {
        if (window.google?.maps?.importLibrary) {
          resolve(window.google.maps);
        } else {
          googleMapsLoadPromise = null;
          reject(new Error("Google Maps loaded without importLibrary support"));
        }
      };

      if (window.google?.maps?.importLibrary) {
        resolveExistingScript();
        return;
      }

      existingScript.addEventListener("load", resolveExistingScript, {
        once: true,
      });

      existingScript.addEventListener(
        "error",
        () => {
          googleMapsLoadPromise = null;
          reject(new Error("Failed to load Google Maps JavaScript API"));
        },
        {
          once: true,
        },
      );

      return;
    }

    const callbackName = "__anqGoogleMapsLoaded";

    window[callbackName] = () => {
      delete window[callbackName];

      if (window.google?.maps?.importLibrary) {
        resolve(window.google.maps);
      } else {
        googleMapsLoadPromise = null;
        reject(new Error("Google Maps initialized incorrectly"));
      }
    };

    const script = document.createElement("script");

    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;

    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(apiKey)}` +
      "&v=weekly" +
      "&loading=async" +
      "&libraries=places" +
      `&callback=${callbackName}`;

    script.onerror = () => {
      delete window[callbackName];
      googleMapsLoadPromise = null;

      reject(
        new Error(
          "Unable to load Google Maps. Check the API key, billing and website restrictions.",
        ),
      );
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
};

export default function VendorBoundaryMap({
  value = [],
  onChange,
  onPlaceSelect,
  locationValue = null,
  postcode = "",
  readOnly = false,
  height = 500,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const mapElementRef = useRef(null);
  const searchContainerRef = useRef(null);

  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const draftLineRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);

  const mapClickListenerRef = useRef(null);
  const markerListenersRef = useRef([]);
  const pathListenersRef = useRef([]);

  const autocompleteSuggestionRef = useRef(null);
  const autocompleteSessionTokenClassRef = useRef(null);

  const sessionTokenRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const selectedSearchTextRef = useRef("");

  const pointsRef = useRef(normalizePoints(value));
  const drawingRef = useRef(normalizePoints(value).length < 3);
  const selectedPlaceRef = useRef(normalizeLocationValue(locationValue));
  const pinAdjustModeRef = useRef(false);
  const manualPinModeRef = useRef(false);

  const readOnlyRef = useRef(readOnly);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);

  const initialFitCompleteRef = useRef(false);

  const [points, setPoints] = useState(normalizePoints(value));
  const [drawing, setDrawing] = useState(normalizePoints(value).length < 3);

  const [mapReady, setMapReady] = useState(false);
  const [placesReady, setPlacesReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectingPlace, setSelectingPlace] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const [selectedPlace, setSelectedPlace] = useState(
    normalizeLocationValue(locationValue),
  );

  const [pinAdjustMode, setPinAdjustMode] = useState(false);
  const [manualPinMode, setManualPinMode] = useState(false);
  const [markerDragging, setMarkerDragging] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    drawingRef.current = drawing;
  }, [drawing]);

  useEffect(() => {
    selectedPlaceRef.current = selectedPlace;
  }, [selectedPlace]);

  useEffect(() => {
    pinAdjustModeRef.current = pinAdjustMode;

    if (selectedMarkerRef.current?.setDraggable) {
      selectedMarkerRef.current.setDraggable(pinAdjustMode && !readOnly);
    }
  }, [pinAdjustMode, readOnly]);

  useEffect(() => {
    manualPinModeRef.current = manualPinMode;
  }, [manualPinMode]);

  useEffect(() => {
    if (postcode && !searchText.trim() && !selectedPlace) {
      setSearchText(postcode);
    }
  }, [postcode, searchText, selectedPlace]);

  const clearPathListeners = useCallback(() => {
    pathListenersRef.current.forEach((listener) => listener?.remove?.());
    pathListenersRef.current = [];
  }, []);

  const clearMarkerListeners = useCallback(() => {
    markerListenersRef.current.forEach((listener) => listener?.remove?.());
    markerListenersRef.current = [];
  }, []);

  const removeSelectedMarker = useCallback(() => {
    clearMarkerListeners();

    selectedMarkerRef.current?.setMap?.(null);
    selectedMarkerRef.current = null;

    infoWindowRef.current?.close?.();
    infoWindowRef.current = null;
  }, [clearMarkerListeners]);

  const commitPoints = useCallback((nextValue, { notify = true } = {}) => {
    const normalized = normalizePoints(nextValue);

    pointsRef.current = normalized;
    setPoints(normalized);

    if (notify) {
      onChangeRef.current?.(normalized);
    }
  }, []);

  const createSessionToken = useCallback(() => {
    const TokenClass = autocompleteSessionTokenClassRef.current;

    if (!TokenClass) {
      sessionTokenRef.current = null;
      return null;
    }

    const token = new TokenClass();
    sessionTokenRef.current = token;

    return token;
  }, []);

  const getSessionToken = useCallback(() => {
    return sessionTokenRef.current || createSessionToken();
  }, [createSessionToken]);

  const createInfoWindowContent = useCallback((place, canDrag) => {
    const wrapper = document.createElement("div");
    wrapper.style.maxWidth = "290px";

    const title = document.createElement("strong");
    title.textContent = place?.displayName || "Selected location";
    title.style.display = "block";
    title.style.color = "#07194f";
    title.style.fontSize = "13px";
    title.style.marginBottom = "5px";
    wrapper.appendChild(title);

    if (place?.formattedAddress) {
      const address = document.createElement("span");
      address.textContent = place.formattedAddress;
      address.style.display = "block";
      address.style.color = "#667297";
      address.style.fontSize = "11px";
      address.style.lineHeight = "1.5";
      wrapper.appendChild(address);
    }

    const coordinates = document.createElement("span");
    coordinates.textContent = `Lat ${Number(place?.lat).toFixed(6)}, Lng ${Number(
      place?.lng,
    ).toFixed(6)}`;
    coordinates.style.display = "block";
    coordinates.style.marginTop = "6px";
    coordinates.style.color = "#005eff";
    coordinates.style.fontSize = "10px";
    coordinates.style.fontWeight = "700";
    wrapper.appendChild(coordinates);

    if (canDrag) {
      const instruction = document.createElement("span");
      instruction.textContent = "Drag the pin to adjust the exact location.";
      instruction.style.display = "block";
      instruction.style.marginTop = "6px";
      instruction.style.color = "#11703b";
      instruction.style.fontSize = "10px";
      instruction.style.fontWeight = "800";
      wrapper.appendChild(instruction);
    }

    return wrapper;
  }, []);

  const updateInfoWindow = useCallback(
    (place, open = true) => {
      const maps = window.google?.maps;
      const map = mapRef.current;
      const marker = selectedMarkerRef.current;

      if (!maps || !map || !marker || !place) {
        return;
      }

      infoWindowRef.current?.close?.();

      const infoWindow = new maps.InfoWindow({
        content: createInfoWindowContent(
          place,
          pinAdjustModeRef.current && !readOnlyRef.current,
        ),
      });

      infoWindowRef.current = infoWindow;

      if (open) {
        infoWindow.open({
          map,
          anchor: marker,
        });
      }
    },
    [createInfoWindowContent],
  );

  const fitBoundary = useCallback(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    const currentPoints = pointsRef.current;

    if (!map || !maps || !currentPoints.length) {
      return;
    }

    const bounds = new maps.LatLngBounds();

    currentPoints.forEach((point) => bounds.extend(point));

    map.fitBounds(bounds, 45);

    window.setTimeout(() => {
      if (map.getZoom() && map.getZoom() > 16) {
        map.setZoom(16);
      }
    }, 150);
  }, []);

  const handleDraggedMarkerPosition = useCallback(
    async (position) => {
      const maps = window.google?.maps;
      const map = mapRef.current;
      const marker = selectedMarkerRef.current;

      if (!maps || !map || !marker || !position) {
        return;
      }

      setMarkerDragging(false);
      setReverseGeocoding(true);
      setMapError("");

      map.panTo(position);

      const previousPlace = selectedPlaceRef.current || {
        displayName: "Adjusted location",
        formattedAddress: `${position.lat}, ${position.lng}`,
      };

      let adjustedPlace = {
        ...previousPlace,
        lat: position.lat,
        lng: position.lng,
        isAdjusted: true,
      };

      try {
        const result = await reverseGeocodePosition(maps, position);
        adjustedPlace = buildDraggedPlaceData(result, position, previousPlace);
      } catch (error) {
        console.warn("Reverse geocoding after marker drag failed:", error);

        setMapError(
          `${getGoogleErrorMessage(error)} The adjusted coordinates were still retained.`,
        );
      } finally {
        setReverseGeocoding(false);
      }

      selectedPlaceRef.current = adjustedPlace;
      setSelectedPlace(adjustedPlace);

      selectedSearchTextRef.current = adjustedPlace.formattedAddress;
      setSearchText(adjustedPlace.formattedAddress);

      marker.setTitle?.(adjustedPlace.displayName || "Adjusted location");
      marker.setPosition?.(position);

      updateInfoWindow(adjustedPlace, true);
      onPlaceSelectRef.current?.(adjustedPlace);
    },
    [updateInfoWindow],
  );

  const showPlaceOnMap = useCallback(
    ({ place, position, viewport, enableAdjustment = true }) => {
      const map = mapRef.current;
      const maps = window.google?.maps;

      if (!map || !maps || !position || !place) {
        return;
      }

      removeSelectedMarker();

      const marker = new maps.Marker({
        map,
        position,
        title:
          place.displayName || place.formattedAddress || "Selected location",
        animation: maps.Animation?.DROP,
        draggable: enableAdjustment && !readOnlyRef.current,
      });

      selectedMarkerRef.current = marker;

      markerListenersRef.current = [
        marker.addListener("click", () => {
          updateInfoWindow(selectedPlaceRef.current || place, true);
        }),
        marker.addListener("dragstart", () => {
          setMarkerDragging(true);
          setMapError("");
          infoWindowRef.current?.close?.();
        }),
        marker.addListener("dragend", (event) => {
          const draggedPosition = toPlainLocation(
            event?.latLng || marker.getPosition?.(),
          );

          if (draggedPosition) {
            handleDraggedMarkerPosition(draggedPosition);
          } else {
            setMarkerDragging(false);
            setMapError("The adjusted pin position could not be read.");
          }
        }),
      ];

      if (viewport) {
        map.fitBounds(viewport, 55);

        window.setTimeout(() => {
          if (map.getZoom() && map.getZoom() > 17) {
            map.setZoom(17);
          }
        }, 150);
      } else {
        map.panTo(position);
        map.setZoom(15);
      }

      window.setTimeout(() => {
        updateInfoWindow(place, true);
      }, 250);
    },
    [handleDraggedMarkerPosition, removeSelectedMarker, updateInfoWindow],
  );

  const placePinAtPosition = useCallback(
    async (position) => {
      if (!position || readOnlyRef.current || !mapRef.current) {
        return;
      }

      drawingRef.current = false;
      setDrawing(false);

      pinAdjustModeRef.current = true;
      setPinAdjustMode(true);

      manualPinModeRef.current = true;
      setManualPinMode(true);

      setDropdownOpen(false);
      setSearchError("");
      setMapError("");

      const manualPlace = {
        placeId: null,
        displayName: "Manual pin location",
        formattedAddress: `${position.lat}, ${position.lng}`,
        postcode: "",
        locality: "",
        administrativeArea: "",
        country: "",
        lat: position.lat,
        lng: position.lng,
        isAdjusted: true,
        isManual: true,
      };

      selectedPlaceRef.current = manualPlace;
      setSelectedPlace(manualPlace);

      selectedSearchTextRef.current = manualPlace.formattedAddress;

      setSearchText(manualPlace.formattedAddress);

      showPlaceOnMap({
        place: manualPlace,
        position,
        viewport: null,
        enableAdjustment: true,
      });

      await handleDraggedMarkerPosition(position);
    },
    [handleDraggedMarkerPosition, showPlaceOnMap],
  );

  useEffect(() => {
    const nextPoints = normalizePoints(value);

    if (!pointsAreEqual(nextPoints, pointsRef.current)) {
      pointsRef.current = nextPoints;
      setPoints(nextPoints);

      const shouldDraw = nextPoints.length < 3;
      drawingRef.current = shouldDraw;
      setDrawing(shouldDraw);

      initialFitCompleteRef.current = false;
    }
  }, [value]);

  useEffect(() => {
    let cancelled = false;

    const initializeGoogleMap = async () => {
      setMapLoading(true);
      setMapError("");

      try {
        const maps = await loadGoogleMaps(apiKey);
        const placesLibrary = await maps.importLibrary("places");

        if (
          !placesLibrary?.AutocompleteSuggestion ||
          !placesLibrary?.AutocompleteSessionToken
        ) {
          throw new Error(
            "Google Places Autocomplete Data API is unavailable. Enable Places API (New) for this key.",
          );
        }

        if (cancelled || !mapElementRef.current) {
          return;
        }

        autocompleteSuggestionRef.current =
          placesLibrary.AutocompleteSuggestion;

        autocompleteSessionTokenClassRef.current =
          placesLibrary.AutocompleteSessionToken;

        createSessionToken();

        const initialLocation = selectedPlaceRef.current;
        const initialPoints = pointsRef.current;

        const initialCenter = initialLocation
          ? {
              lat: initialLocation.lat,
              lng: initialLocation.lng,
            }
          : initialPoints.length
            ? initialPoints[0]
            : DEFAULT_MAP_CENTER;

        const map = new maps.Map(mapElementRef.current, {
          center: initialCenter,
          zoom: initialLocation ? 15 : initialPoints.length ? 11 : 6,
          mapTypeId: maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });

        const polygon = new maps.Polygon({
          paths: initialPoints,
          strokeColor: "#f20f18",
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: "#f20f18",
          fillOpacity: 0.16,
          editable: initialPoints.length >= 3 && !readOnlyRef.current,
          draggable: false,
          clickable: true,
        });

        const draftLine = new maps.Polyline({
          path: initialPoints,
          strokeColor: "#005eff",
          strokeOpacity: 1,
          strokeWeight: 3,
          clickable: false,
        });

        mapRef.current = map;
        polygonRef.current = polygon;
        draftLineRef.current = draftLine;

        setMapReady(true);
        setPlacesReady(true);
      } catch (error) {
        console.error("Google Maps initialization error:", error);

        if (!cancelled) {
          setMapError(getGoogleErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    };

    initializeGoogleMap();

    return () => {
      cancelled = true;
      searchRequestIdRef.current += 1;

      clearPathListeners();
      clearMarkerListeners();

      mapClickListenerRef.current?.remove?.();
      mapClickListenerRef.current = null;

      removeSelectedMarker();

      polygonRef.current?.setMap(null);
      draftLineRef.current?.setMap(null);

      polygonRef.current = null;
      draftLineRef.current = null;
      mapRef.current = null;

      autocompleteSuggestionRef.current = null;
      autocompleteSessionTokenClassRef.current = null;
      sessionTokenRef.current = null;

      setMapReady(false);
      setPlacesReady(false);
    };
  }, [
    apiKey,
    clearMarkerListeners,
    clearPathListeners,
    createSessionToken,
    removeSelectedMarker,
  ]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    const normalizedLocation = normalizeLocationValue(locationValue);

    if (!normalizedLocation) {
      return;
    }

    if (
      sameLocation(normalizedLocation, selectedPlaceRef.current) &&
      selectedMarkerRef.current
    ) {
      return;
    }

    selectedPlaceRef.current = normalizedLocation;
    setSelectedPlace(normalizedLocation);
    selectedSearchTextRef.current = normalizedLocation.formattedAddress;
    setSearchText(normalizedLocation.formattedAddress);

    showPlaceOnMap({
      place: normalizedLocation,
      position: {
        lat: normalizedLocation.lat,
        lng: normalizedLocation.lng,
      },
      viewport: null,
      enableAdjustment: false,
    });
  }, [locationValue, mapReady, showPlaceOnMap]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (readOnly || !placesReady || !autocompleteSuggestionRef.current) {
      return undefined;
    }

    const query = searchText.trim();

    if (query.length < 2 || query === selectedSearchTextRef.current) {
      searchRequestIdRef.current += 1;
      setSearching(false);
      setSearchError("");
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      return undefined;
    }

    const requestId = ++searchRequestIdRef.current;

    setSearching(true);
    setSearchError("");
    setDropdownOpen(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const request = {
          input: query,
          sessionToken: getSessionToken(),
          language: MAP_LANGUAGE,
          region: MAP_REGION,
        };

        if (MAP_COUNTRIES.length) {
          request.includedRegionCodes = MAP_COUNTRIES;
        }

        const mapCenter = mapRef.current?.getCenter?.();

        if (mapCenter) {
          request.origin = {
            lat: mapCenter.lat(),
            lng: mapCenter.lng(),
          };
        }

        const response =
          await autocompleteSuggestionRef.current.fetchAutocompleteSuggestions(
            request,
          );

        if (requestId !== searchRequestIdRef.current) {
          return;
        }

        const nextSuggestions = (response?.suggestions || [])
          .map((suggestion, index) => {
            const prediction = suggestion?.placePrediction;

            if (!prediction) {
              return null;
            }

            const fullText = getFormattableText(prediction.text);

            const primaryText =
              getFormattableText(prediction.structuredFormat?.mainText) ||
              getFormattableText(prediction.mainText) ||
              fullText;

            const secondaryText =
              getFormattableText(prediction.structuredFormat?.secondaryText) ||
              getFormattableText(prediction.secondaryText);

            return {
              key: prediction.placeId || `${fullText}-${index}`,
              placeId: prediction.placeId,
              primaryText,
              secondaryText,
              fullText,
              prediction,
            };
          })
          .filter(Boolean)
          .slice(0, 8);

        setSuggestions(nextSuggestions);
        setActiveSuggestionIndex(nextSuggestions.length ? 0 : -1);
        setDropdownOpen(true);
      } catch (error) {
        if (requestId !== searchRequestIdRef.current) {
          return;
        }

        console.error("Google autocomplete request failed:", error);

        setSuggestions([]);
        setActiveSuggestionIndex(-1);
        setDropdownOpen(true);
        setSearchError(getGoogleErrorMessage(error));
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [getSessionToken, placesReady, readOnly, searchText]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || readOnly) {
      return undefined;
    }

    mapClickListenerRef.current?.remove?.();

    mapClickListenerRef.current = mapRef.current.addListener(
      "click",
      (event) => {
        setDropdownOpen(false);

        if (readOnlyRef.current || !event?.latLng) {
          return;
        }

        const clickedPosition = toPlainLocation(event.latLng);

        if (!clickedPosition) {
          setMapError("The selected map position could not be read.");

          return;
        }

        /*
         * Manual pin mode has priority
         * over boundary drawing.
         *
         * This continues to work after
         * the boundary has been completed.
         */
        if (manualPinModeRef.current) {
          void placePinAtPosition(clickedPosition);

          return;
        }

        if (!drawingRef.current) {
          return;
        }

        commitPoints([...pointsRef.current, clickedPosition]);
      },
    );

    return () => {
      mapClickListenerRef.current?.remove?.();
      mapClickListenerRef.current = null;
    };
  }, [commitPoints, mapReady, placePinAtPosition, readOnly]);

  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !polygonRef.current ||
      !draftLineRef.current
    ) {
      return;
    }

    clearPathListeners();

    const polygon = polygonRef.current;
    const draftLine = draftLineRef.current;

    polygon.setPath(points);
    polygon.setMap(points.length >= 3 ? mapRef.current : null);
    polygon.setOptions({
      clickable: !manualPinMode,

      editable: points.length >= 3 && !readOnly && !drawing && !manualPinMode,
    });
    draftLine.setPath(points);
    draftLine.setMap(
      points.length > 0 && (drawing || points.length < 3)
        ? mapRef.current
        : null,
    );

    if (points.length >= 3 && !readOnly && !drawing && !manualPinMode) {
      const path = polygon.getPath();

      const synchronizePath = () => {
        const updatedPoints = path.getArray().map((coordinate) => ({
          lat: Number(coordinate.lat().toFixed(7)),
          lng: Number(coordinate.lng().toFixed(7)),
        }));

        commitPoints(updatedPoints);
      };

      pathListenersRef.current = [
        path.addListener("set_at", synchronizePath),
        path.addListener("insert_at", synchronizePath),
        path.addListener("remove_at", synchronizePath),
      ];
    }

    if (points.length && !initialFitCompleteRef.current) {
      initialFitCompleteRef.current = true;
      window.setTimeout(fitBoundary, 120);
    }
  }, [
    clearPathListeners,
    commitPoints,
    drawing,
    fitBoundary,
    manualPinMode,
    mapReady,
    points,
    readOnly,
  ]);

  const selectSuggestion = async (suggestion) => {
    if (!suggestion?.prediction || selectingPlace) {
      return;
    }

    setSelectingPlace(true);
    setMapError("");
    setSearchError("");

    try {
      const place = suggestion.prediction.toPlace();

      await place.fetchFields({
        fields: [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "viewport",
          "addressComponents",
        ],
      });

      const position = toPlainLocation(place.location);

      if (!position) {
        throw new Error("The selected Google place has no valid coordinates.");
      }

      const displayName =
        place.displayName || suggestion.primaryText || "Selected location";

      const formattedAddress =
        place.formattedAddress || suggestion.fullText || displayName;

      const postcodeValue = getAddressComponent(
        place.addressComponents,
        "postal_code",
      );

      const locality =
        getAddressComponent(place.addressComponents, "postal_town") ||
        getAddressComponent(place.addressComponents, "locality");

      const administrativeArea =
        getAddressComponent(
          place.addressComponents,
          "administrative_area_level_2",
        ) ||
        getAddressComponent(
          place.addressComponents,
          "administrative_area_level_1",
        );

      const country = getAddressComponent(place.addressComponents, "country");

      const placeData = {
        placeId: place.id || suggestion.placeId,
        displayName,
        formattedAddress,
        postcode: postcodeValue,
        locality,
        administrativeArea,
        country,
        lat: position.lat,
        lng: position.lng,
        isAdjusted: false,
      };

      selectedSearchTextRef.current = formattedAddress;
      selectedPlaceRef.current = placeData;

      setSearchText(formattedAddress);
      setSelectedPlace(placeData);
      setSuggestions([]);
      setDropdownOpen(false);
      setActiveSuggestionIndex(-1);

      drawingRef.current = false;
      setDrawing(false);

      manualPinModeRef.current = false;
      setManualPinMode(false);

      pinAdjustModeRef.current = true;
      setPinAdjustMode(true);

      showPlaceOnMap({
        place: placeData,
        position,
        viewport: place.viewport,
        enableAdjustment: true,
      });

      onPlaceSelectRef.current?.(placeData);
      createSessionToken();
    } catch (error) {
      console.error("Google place selection failed:", error);
      setMapError(getGoogleErrorMessage(error));
    } finally {
      setSelectingPlace(false);
    }
  };

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;

    selectedSearchTextRef.current = "";

    setSearchText(nextValue);
    setSearchError("");
    setDropdownOpen(nextValue.trim().length >= 2);
    setActiveSuggestionIndex(-1);

    if (!nextValue.trim()) {
      searchRequestIdRef.current += 1;
      setSuggestions([]);
      setSearching(false);
      setDropdownOpen(false);
      setSelectedPlace(null);
      selectedPlaceRef.current = null;
      setPinAdjustMode(false);
      removeSelectedMarker();
      onPlaceSelectRef.current?.(null);
      createSessionToken();
    }
  };

  const handleSearchFocus = () => {
    if (searchText.trim().length >= 2) {
      setDropdownOpen(true);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setDropdownOpen(true);

      setActiveSuggestionIndex((previous) => {
        if (!suggestions.length) {
          return -1;
        }

        return Math.min(previous + 1, suggestions.length - 1);
      });

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveSuggestionIndex((previous) => {
        if (!suggestions.length) {
          return -1;
        }

        return Math.max(previous - 1, 0);
      });

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (dropdownOpen && suggestions.length) {
        const selectedSuggestion =
          suggestions[activeSuggestionIndex >= 0 ? activeSuggestionIndex : 0];

        selectSuggestion(selectedSuggestion);
      }

      return;
    }

    if (event.key === "Escape") {
      setDropdownOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const clearSelectedPlace = () => {
    searchRequestIdRef.current += 1;
    selectedSearchTextRef.current = "";
    selectedPlaceRef.current = null;

    setSearchText("");
    setSuggestions([]);
    setSearchError("");
    setDropdownOpen(false);
    setSelectedPlace(null);
    setActiveSuggestionIndex(-1);
    setPinAdjustMode(false);
    setMarkerDragging(false);
    setReverseGeocoding(false);

    manualPinModeRef.current = false;
    setManualPinMode(false);

    pinAdjustModeRef.current = false;
    setPinAdjustMode(false);

    removeSelectedMarker();
    onPlaceSelectRef.current?.(null);
    createSessionToken();
  };

  const enableManualPinPlacement = () => {
    if (readOnly || !mapRef.current) {
      return;
    }

    drawingRef.current = false;
    setDrawing(false);

    manualPinModeRef.current = true;
    setManualPinMode(true);

    pinAdjustModeRef.current = true;
    setPinAdjustMode(true);

    setDropdownOpen(false);
    setMapError("");

    polygonRef.current?.setOptions({
      clickable: false,
      editable: false,
    });

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setDraggable?.(true);

      updateInfoWindow(selectedPlaceRef.current, true);

      return;
    }

    /*
     * When no location has been searched,
     * initially drop the pin in the centre
     * of the currently visible map.
     */
    const mapCenter =
      toPlainLocation(mapRef.current.getCenter?.()) || DEFAULT_MAP_CENTER;

    void placePinAtPosition(mapCenter);
  };

  const enablePinAdjustment = () => {
    if (!selectedPlace || readOnly) {
      return;
    }

    drawingRef.current = false;
    setDrawing(false);

    manualPinModeRef.current = false;
    setManualPinMode(false);

    pinAdjustModeRef.current = true;
    setPinAdjustMode(true);

    selectedMarkerRef.current?.setDraggable?.(true);

    updateInfoWindow(selectedPlace, true);

    setDropdownOpen(false);
    setMapError("");
  };

  const lockPin = () => {
    manualPinModeRef.current = false;
    setManualPinMode(false);

    pinAdjustModeRef.current = false;
    setPinAdjustMode(false);

    selectedMarkerRef.current?.setDraggable?.(false);

    polygonRef.current?.setOptions({
      clickable: true,

      editable:
        pointsRef.current.length >= 3 &&
        !drawingRef.current &&
        !readOnlyRef.current,
    });

    updateInfoWindow(selectedPlaceRef.current, true);
  };

  const centreOnSelectedPin = () => {
    if (!selectedPlace || !mapRef.current) {
      return;
    }

    mapRef.current.panTo({
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
    });

    if ((mapRef.current.getZoom?.() || 0) < 15) {
      mapRef.current.setZoom(15);
    }

    updateInfoWindow(selectedPlace, true);
  };

  const startDrawing = () => {
    if (readOnly) {
      return;
    }

    manualPinModeRef.current = false;
    setManualPinMode(false);

    pinAdjustModeRef.current = false;
    setPinAdjustMode(false);

    selectedMarkerRef.current?.setDraggable?.(false);

    polygonRef.current?.setOptions({
      clickable: true,
      editable: false,
    });

    drawingRef.current = true;
    setDrawing(true);

    setMapError("");
    setDropdownOpen(false);
  };

  const finishDrawing = () => {
    if (pointsRef.current.length < 3) {
      setMapError(
        "Click at least three different map locations to complete the boundary.",
      );
      return;
    }

    drawingRef.current = false;
    setDrawing(false);
    setMapError("");
    setDropdownOpen(false);
    fitBoundary();
  };

  const undoLastPoint = () => {
    if (readOnly || !pointsRef.current.length) {
      return;
    }

    const nextPoints = pointsRef.current.slice(0, -1);
    commitPoints(nextPoints);

    if (nextPoints.length < 3) {
      drawingRef.current = true;
      setDrawing(true);
    }
  };

  const clearBoundary = () => {
    if (readOnly) {
      return;
    }

    commitPoints([]);
    drawingRef.current = true;
    setDrawing(true);
    setMapError("");

    if (selectedPlace) {
      mapRef.current?.panTo({
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
      });
      mapRef.current?.setZoom(14);
    } else {
      mapRef.current?.setCenter(DEFAULT_MAP_CENTER);
      mapRef.current?.setZoom(6);
    }
  };

  return (
    <div className="vendor-boundary-map">
      <style>
        {`
          .vendor-boundary-map {
            width: 100%;
            position: relative;
          }

          .vendor-boundary-map .boundary-place-search {
            position: relative;
            z-index: 500;
            width: 100%;
            margin-bottom: 13px;
          }

          .vendor-boundary-map .boundary-search-field {
            position: relative;
            display: flex;
            align-items: center;
          }

          .vendor-boundary-map .boundary-search-icon {
            position: absolute;
            left: 15px;
            z-index: 2;
            color: #667297;
            pointer-events: none;
          }

          .vendor-boundary-map .boundary-search-input {
            width: 100%;
            height: 50px;
            box-sizing: border-box;
            border: 1px solid #d5dfed;
            border-radius: 11px;
            background: #ffffff;
            color: #07194f;
            padding: 0 88px 0 44px;
            outline: none;
            font-size: 14px;
            font-weight: 800;
            transition: 0.2s ease;
          }

          .vendor-boundary-map .boundary-search-input:focus {
            border-color: #005eff;
            box-shadow: 0 0 0 3px rgba(0, 94, 255, 0.12);
          }

          .vendor-boundary-map .boundary-search-input::placeholder {
            color: #8d98ae;
            font-weight: 700;
          }

          .vendor-boundary-map .boundary-search-loader {
            position: absolute;
            right: 48px;
            color: #005eff;
            animation: boundary-map-spin 0.8s linear infinite;
          }

          .vendor-boundary-map .boundary-search-clear {
            position: absolute;
            right: 8px;
            width: 35px;
            height: 35px;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: #667297;
            display: grid;
            place-items: center;
            cursor: pointer;
          }

          .vendor-boundary-map .boundary-search-clear:hover {
            background: #eef3fa;
            color: #07194f;
          }

          .vendor-boundary-map .boundary-search-dropdown {
            position: absolute;
            top: calc(100% + 7px);
            left: 0;
            right: 0;
            z-index: 9999;
            max-height: 350px;
            overflow-y: auto;
            border: 1px solid #d5dfed;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 22px 55px rgba(7, 25, 79, 0.22);
          }

          .vendor-boundary-map .boundary-search-state {
            min-height: 78px;
            padding: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            color: #667297;
            text-align: center;
            font-size: 12px;
            line-height: 1.55;
            font-weight: 800;
          }

          .vendor-boundary-map .boundary-search-state.error {
            color: #c60d16;
            background: #fff7f7;
          }

          .vendor-boundary-map .boundary-suggestion {
            width: 100%;
            min-height: 68px;
            padding: 11px 14px;
            border: 0;
            border-bottom: 1px solid #edf1f6;
            background: #ffffff;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            text-align: left;
            cursor: pointer;
            transition: 0.16s ease;
          }

          .vendor-boundary-map .boundary-suggestion:hover,
          .vendor-boundary-map .boundary-suggestion.active {
            background: #f1f6ff;
          }

          .vendor-boundary-map .boundary-suggestion-marker {
            width: 36px;
            height: 36px;
            flex: 0 0 auto;
            border-radius: 10px;
            background: #eaf2ff;
            color: #005eff;
            display: grid;
            place-items: center;
          }

          .vendor-boundary-map .boundary-suggestion-content {
            min-width: 0;
            flex: 1;
          }

          .vendor-boundary-map .boundary-suggestion-content b {
            display: block;
            color: #07194f;
            font-size: 12px;
            line-height: 1.4;
            font-weight: 950;
          }

          .vendor-boundary-map .boundary-suggestion-content span {
            display: block;
            margin-top: 3px;
            color: #667297;
            font-size: 11px;
            line-height: 1.45;
            font-weight: 700;
          }

          .vendor-boundary-map .boundary-google-credit {
            min-height: 34px;
            border-top: 1px solid #edf1f6;
            background: #fbfcfe;
            color: #778399;
            padding: 0 13px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            font-size: 10px;
            font-weight: 850;
          }

          .vendor-boundary-map .boundary-selected-place {
            margin-bottom: 13px;
            border: 1px solid #bdd3f3;
            border-radius: 11px;
            background: #f3f8ff;
            padding: 12px 13px;
            display: flex;
            align-items: flex-start;
            gap: 11px;
          }

          .vendor-boundary-map .boundary-selected-place-icon {
            width: 38px;
            height: 38px;
            flex: 0 0 auto;
            border-radius: 10px;
            background: #005eff;
            color: #ffffff;
            display: grid;
            place-items: center;
          }

          .vendor-boundary-map .boundary-selected-place-content {
            flex: 1;
            min-width: 0;
          }

          .vendor-boundary-map .boundary-selected-place-content small {
            display: block;
            color: #005eff;
            font-size: 9px;
            font-weight: 950;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .vendor-boundary-map .boundary-selected-place-content b {
            display: block;
            margin-top: 4px;
            color: #07194f;
            font-size: 12px;
            line-height: 1.45;
            font-weight: 950;
          }

          .vendor-boundary-map .boundary-selected-place-content span {
            display: block;
            margin-top: 3px;
            color: #667297;
            font-size: 11px;
            line-height: 1.5;
            font-weight: 750;
          }

          .vendor-boundary-map .boundary-selected-coordinates {
            color: #005eff !important;
            font-family: monospace;
            font-size: 10px !important;
          }

          .vendor-boundary-map .boundary-selected-place-actions {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
            justify-content: flex-end;
          }

          .vendor-boundary-map .boundary-pin-action {
            min-height: 34px;
            border: 1px solid #cbd8ea;
            border-radius: 8px;
            background: #ffffff;
            color: #07194f;
            padding: 0 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 10px;
            font-weight: 900;
            cursor: pointer;
          }

          .vendor-boundary-map .boundary-pin-action.active {
            border-color: #005eff;
            background: #005eff;
            color: #ffffff;
          }

          .vendor-boundary-map .boundary-pin-action.lock {
            border-color: #b9e5c8;
            background: #eaf9ef;
            color: #11703b;
          }

          .vendor-boundary-map .boundary-toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 9px;
            margin-bottom: 12px;
          }

          .vendor-boundary-map .boundary-tool-btn {
            min-height: 40px;
            border: 1px solid #d7e1f0;
            border-radius: 9px;
            background: #ffffff;
            color: #07194f;
            padding: 0 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
            transition: 0.2s ease;
          }

          .vendor-boundary-map .boundary-tool-btn:hover:not(:disabled) {
            border-color: #005eff;
            color: #005eff;
            background: #f4f8ff;
          }

          .vendor-boundary-map .boundary-tool-btn.primary {
            border-color: #005eff;
            background: #005eff;
            color: #ffffff;
          }

          .vendor-boundary-map .boundary-tool-btn.success {
            border-color: #169c52;
            background: #169c52;
            color: #ffffff;
          }

          .vendor-boundary-map .boundary-tool-btn.danger {
            border-color: #f1c5c7;
            background: #fff7f7;
            color: #d50912;
          }

          .vendor-boundary-map .boundary-tool-btn:disabled,
          .vendor-boundary-map .boundary-pin-action:disabled {
            cursor: not-allowed;
            opacity: 0.48;
          }

          .vendor-boundary-map .boundary-point-count {
            margin-left: auto;
            min-height: 36px;
            padding: 0 13px;
            border-radius: 999px;
            background: #eef5ff;
            color: #0a3a8d;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-size: 12px;
            font-weight: 900;
          }

          .vendor-boundary-map .boundary-point-count.complete {
            background: #eaf9f0;
            color: #12733d;
          }

          .vendor-boundary-map .boundary-map-shell {
            position: relative;
          }

          .vendor-boundary-map .boundary-map-canvas {
            width: 100%;
            border: 1px solid #dce5f3;
            border-radius: 14px;
            overflow: hidden;
            background: #eef2f7;
          }

          .vendor-boundary-map .boundary-pin-mode-banner {
            position: absolute;
            top: 12px;
            left: 50%;
            z-index: 20;
            transform: translateX(-50%);
            max-width: calc(100% - 32px);
            min-height: 38px;
            border: 1px solid rgba(0, 94, 255, 0.24);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.96);
            box-shadow: 0 10px 28px rgba(7, 25, 79, 0.15);
            color: #07194f;
            padding: 0 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
            pointer-events: none;
          }

          .vendor-boundary-map .boundary-pin-mode-banner.dragging {
            border-color: #169c52;
            color: #11703b;
          }

          .vendor-boundary-map .boundary-map-loading {
            min-height: 72px;
            margin-bottom: 12px;
            border: 1px solid #dce5f3;
            border-radius: 11px;
            background: #f7f9fd;
            color: #667297;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            font-size: 12px;
            font-weight: 850;
          }

          .vendor-boundary-map .boundary-map-help {
            margin: 11px 0 0;
            color: #667297;
            font-size: 12px;
            line-height: 1.65;
            font-weight: 750;
          }

          .vendor-boundary-map .boundary-map-help strong {
            color: #07194f;
          }

          .vendor-boundary-map .boundary-map-error {
            margin-top: 11px;
            border: 1px solid #f2c5c7;
            border-radius: 9px;
            background: #fff6f6;
            color: #c90b14;
            padding: 11px 13px;
            font-size: 12px;
            line-height: 1.55;
            font-weight: 850;
          }

          @keyframes boundary-map-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 820px) {
            .vendor-boundary-map .boundary-selected-place {
              flex-wrap: wrap;
            }

            .vendor-boundary-map .boundary-selected-place-actions {
              width: 100%;
              justify-content: flex-start;
            }
          }

          @media (max-width: 700px) {
            .vendor-boundary-map .boundary-tool-btn {
              flex: 1 1 calc(50% - 9px);
            }

            .vendor-boundary-map .boundary-point-count {
              width: 100%;
              margin-left: 0;
              justify-content: center;
            }

            .vendor-boundary-map .boundary-search-input {
              font-size: 12px;
            }

            .vendor-boundary-map .boundary-pin-mode-banner {
              white-space: normal;
              text-align: center;
            }
          }
        `}
      </style>

{!readOnly ? (
  <>
    {mapLoading ? (
      <div className="boundary-map-loading">
        <LoaderCircle
          size={17}
          style={{
            animation: "boundary-map-spin 0.8s linear infinite",
          }}
        />

        Loading Google Maps and Places...
      </div>
    ) : null}

    {/* GOOGLE PLACES SEARCH BAR */}
    <div
      ref={searchContainerRef}
      className="boundary-place-search"
    >
      <div className="boundary-search-field">
        <Search
          size={18}
          className="boundary-search-icon"
        />

        <input
          type="text"
          value={searchText}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onKeyDown={handleSearchKeyDown}
          className="boundary-search-input"
          placeholder="Search address, postcode, town or place..."
          autoComplete="off"
          spellCheck="false"
          disabled={!placesReady}
          aria-label="Search Google Maps places"
          aria-expanded={dropdownOpen}
          aria-autocomplete="list"
        />

        {searching ||
        selectingPlace ||
        reverseGeocoding ? (
          <LoaderCircle
            size={17}
            className="boundary-search-loader"
          />
        ) : null}

        {searchText ? (
          <button
            type="button"
            className="boundary-search-clear"
            onClick={clearSelectedPlace}
            aria-label="Clear place search"
          >
            <X size={17} />
          </button>
        ) : null}
      </div>

      {/* GOOGLE PLACE SUGGESTION DROPDOWN */}
      {dropdownOpen ? (
        <div
          className="boundary-search-dropdown"
          role="listbox"
        >
          {searching ? (
            <div className="boundary-search-state">
              <LoaderCircle
                size={17}
                style={{
                  animation:
                    "boundary-map-spin 0.8s linear infinite",
                }}
              />

              Searching Google Maps...
            </div>
          ) : searchError ? (
            <div className="boundary-search-state error">
              {searchError}
            </div>
          ) : suggestions.length ? (
            <>
              {suggestions.map(
                (suggestion, index) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={
                      index ===
                      activeSuggestionIndex
                    }
                    key={suggestion.key}
                    className={`boundary-suggestion ${
                      index ===
                      activeSuggestionIndex
                        ? "active"
                        : ""
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => {
                      setActiveSuggestionIndex(
                        index,
                      );
                    }}
                    onClick={() => {
                      selectSuggestion(
                        suggestion,
                      );
                    }}
                  >
                    <span className="boundary-suggestion-marker">
                      <MapPin size={17} />
                    </span>

                    <span className="boundary-suggestion-content">
                      <b>
                        {
                          suggestion.primaryText
                        }
                      </b>

                      {suggestion.secondaryText ? (
                        <span>
                          {
                            suggestion.secondaryText
                          }
                        </span>
                      ) : null}
                    </span>
                  </button>
                ),
              )}

              <div className="boundary-google-credit">
                Powered by Google
              </div>
            </>
          ) : searchText.trim().length >=
            2 ? (
            <div className="boundary-search-state">
              No Google Maps places found
              for this search.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>

    {/* SELECTED LOCATION DETAILS */}
    {selectedPlace ? (
      <div className="boundary-selected-place">
        <div className="boundary-selected-place-icon">
          <Navigation size={17} />
        </div>

        <div className="boundary-selected-place-content">
          <small>
            Selected vendor location
          </small>

          <b>
            {selectedPlace.displayName ||
              "Selected location"}
          </b>

          <span>
            {selectedPlace.formattedAddress ||
              `${selectedPlace.lat}, ${selectedPlace.lng}`}
          </span>

          {selectedPlace.postcode ? (
            <span>
              Postcode:{" "}
              {selectedPlace.postcode}
            </span>
          ) : null}

          <span>
            Latitude:{" "}
            {Number(
              selectedPlace.lat,
            ).toFixed(6)}
            {" · "}
            Longitude:{" "}
            {Number(
              selectedPlace.lng,
            ).toFixed(6)}
          </span>
        </div>

        <button
          type="button"
          className="boundary-selected-place-remove"
          onClick={clearSelectedPlace}
          aria-label="Remove selected location"
        >
          <X size={16} />
        </button>
      </div>
    ) : null}

    {/* PIN AND BOUNDARY CONTROLS */}
    <div className="boundary-toolbar">
      <button
        type="button"
        className={`boundary-tool-btn ${
          manualPinMode ? "primary" : ""
        }`}
        onClick={
          enableManualPinPlacement
        }
      >
        <MapPin size={15} />

        {selectedPlace
          ? "Move Pin Manually"
          : "Drop Pin Manually"}
      </button>

      {selectedPlace ? (
        <>
          <button
            type="button"
            className={`boundary-tool-btn ${
              pinAdjustMode
                ? "success"
                : ""
            }`}
            onClick={
              pinAdjustMode
                ? lockPin
                : enablePinAdjustment
            }
          >
            {pinAdjustMode ? (
              <Lock size={15} />
            ) : (
              <Move size={15} />
            )}

            {pinAdjustMode
              ? "Lock Pin"
              : "Adjust Pin"}
          </button>

          <button
            type="button"
            className="boundary-tool-btn"
            onClick={
              centreOnSelectedPin
            }
          >
            <LocateFixed size={15} />
            Centre Pin
          </button>
        </>
      ) : null}

      <button
        type="button"
        className={`boundary-tool-btn ${
          drawing ? "primary" : ""
        }`}
        onClick={startDrawing}
      >
        <MapPin size={15} />
        Add Boundary Points
      </button>

      <button
        type="button"
        className="boundary-tool-btn success"
        onClick={finishDrawing}
        disabled={points.length < 3}
      >
        <Check size={15} />
        Finish Boundary
      </button>

      <button
        type="button"
        className="boundary-tool-btn"
        onClick={undoLastPoint}
        disabled={!points.length}
      >
        <Undo2 size={15} />
        Undo
      </button>

      <button
        type="button"
        className="boundary-tool-btn"
        onClick={fitBoundary}
        disabled={!points.length}
      >
        <RotateCcw size={15} />
        Fit Boundary
      </button>

      <button
        type="button"
        className="boundary-tool-btn danger"
        onClick={clearBoundary}
        disabled={!points.length}
      >
        <Trash2 size={15} />
        Clear Boundary
      </button>

      <span
        className={`boundary-point-count ${
          points.length >= 3
            ? "complete"
            : ""
        }`}
      >
        <Crosshair size={14} />
        {points.length} boundary points
      </span>
    </div>
  </>
) : (
  /* READ-ONLY PREVIEW TOOLBAR */
  <div className="boundary-toolbar">
    <button
      type="button"
      className="boundary-tool-btn"
      onClick={fitBoundary}
      disabled={!points.length}
    >
      <RotateCcw size={15} />
      Fit Boundary
    </button>

    <span
      className={`boundary-point-count ${
        points.length >= 3
          ? "complete"
          : ""
      }`}
    >
      <MapPin size={14} />
      {points.length} boundary points
    </span>
  </div>
)}

      <div className="boundary-map-shell">
        {selectedPlace && pinAdjustMode && !readOnly ? (
          <div
            className={`boundary-pin-mode-banner ${
              markerDragging ? "dragging" : ""
            }`}
          >
            {markerDragging ? (
              <>
                <Move size={15} /> Release the pin at the exact location
              </>
            ) : reverseGeocoding ? (
              <>
                <LoaderCircle
                  size={15}
                  style={{
                    animation: "boundary-map-spin 0.8s linear infinite",
                  }}
                />
                Updating address from the pin position...
              </>
            ) : (
              <>
                <Move size={15} /> Drag the pin to adjust the exact vendor
                location
              </>
            )}
          </div>
        ) : null}

        <div
          ref={mapElementRef}
          className="boundary-map-canvas"
          style={{
            height: `${height}px`,
          }}
        />
      </div>

      {mapError ? <div className="boundary-map-error">{mapError}</div> : null}
    </div>
  );
}
