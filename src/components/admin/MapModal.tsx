"use client";

import { useEffect, useState } from "react";
import { X, Loader2, MapPin, Users, Calendar, AlertCircle } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet SSR and Icon Issues
const jobIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="h-8 w-8 bg-indigo-500 rounded-full border-4 border-[#0A0A0B] shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center justify-center"><div class="h-2 w-2 bg-white rounded-full"></div></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

interface MapModalProps {
  jobs: any[];
  onClose: () => void;
}

type GeocodedJob = MapModalProps['jobs'][0] & {
  lat?: number;
  lon?: number;
  geocodingFailed?: boolean;
};

export default function MapModal({ jobs, onClose }: MapModalProps) {
  const [geocodedJobs, setGeocodedJobs] = useState<GeocodedJob[]>(jobs);
  const [isGeocoding, setIsGeocoding] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const geocodeJobs = async () => {
      setIsGeocoding(true);
      const updatedJobs = [...jobs];

      for (let i = 0; i < updatedJobs.length; i++) {
        const job = updatedJobs[i];
        try {
          // Add delay to respect Nominatim's strict rate limits (1 req/sec)
          if (i > 0) await new Promise(res => setTimeout(res, 1100));
          
          let addressQuery = `${job.address}, ${job.city || ''} ${job.postalCode || ''}`.trim();
          let url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressQuery)}`;
          
          let res = await fetch(url, { headers: { 'User-Agent': 'QuantumOS-FencingApp/1.0' } });
          let data = await res.json();

          // Fallback 1: Try just the base address string (it might already contain city/state/zip cleanly)
          if (!data || data.length === 0) {
             await new Promise(res => setTimeout(res, 1100));
             url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(job.address)}`;
             res = await fetch(url, { headers: { 'User-Agent': 'QuantumOS-FencingApp/1.0' } });
             data = await res.json();
          }

          // Fallback 2: Try just the City and Postal Code to at least drop a pin in the general area
          if ((!data || data.length === 0) && (job.city || job.postalCode)) {
             await new Promise(res => setTimeout(res, 1100));
             url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${job.city || ''} ${job.postalCode || ''}`.trim())}`;
             res = await fetch(url, { headers: { 'User-Agent': 'QuantumOS-FencingApp/1.0' } });
             data = await res.json();
          }

          if (data && data.length > 0) {
            job.lat = parseFloat(data[0].lat);
            job.lon = parseFloat(data[0].lon);
          } else {
            job.geocodingFailed = true;
          }
        } catch (error) {
          console.error("Geocoding failed for job", job.id);
          job.geocodingFailed = true;
        }

        if (isMounted) {
          setGeocodedJobs([...updatedJobs]);
          setProgress(Math.round(((i + 1) / updatedJobs.length) * 100));
        }
      }

      if (isMounted) setIsGeocoding(false);
    };

    if (jobs.length > 0) {
      geocodeJobs();
    } else {
      setIsGeocoding(false);
    }

    return () => {
      isMounted = false;
    };
  }, [jobs]);

  const validJobs = geocodedJobs.filter(j => j.lat && j.lon);
  const centerLat = validJobs.length > 0 ? (validJobs.reduce((sum, j) => sum + j.lat!, 0) / validJobs.length) : 39.8283;
  const centerLon = validJobs.length > 0 ? (validJobs.reduce((sum, j) => sum + j.lon!, 0) / validJobs.length) : -98.5795;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 lg:p-10 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full h-full max-w-7xl bg-[#0A0A0B] border-0 md:border border-gray-800 md:rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="h-20 border-b border-gray-800/50 flex items-center justify-between px-8 bg-[#14151A]/95 backdrop-blur-xl absolute top-0 left-0 right-0 z-[1000] shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <MapPin className="w-5 h-5 text-indigo-400" />
             </div>
             <div>
               <h2 className="text-white font-extrabold text-sm uppercase tracking-widest leading-none">Map View</h2>
               {isGeocoding ? (
                 <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-bold">
                   <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> Locating {jobs.length} properties... ({progress}%)
                 </p>
               ) : (
                 <p className="text-[10px] text-emerald-400 font-bold mt-1">Found {validJobs.length} of {jobs.length} locations</p>
               )}
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-all">
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative mt-[80px] bg-gray-900 overflow-hidden">
           {(!isGeocoding || validJobs.length > 0) && (
             <MapContainer 
               center={[centerLat, centerLon]} 
               zoom={validJobs.length > 0 ? 11 : 4} 
               style={{ height: '100%', width: '100%', outline: 'none' }}
             >
               <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
               />
               {validJobs.map((job) => (
                 <Marker key={job.id} position={[job.lat!, job.lon!]} icon={jobIcon}>
                   {/* Popup styled to fit dashboard aesthetic conceptually */}
                   <Popup className="rounded-xl overflow-hidden border-0">
                     <div className="p-1 min-w-[200px]">
                        <p className="font-extrabold text-sm mb-1">{job.customerName || "Unnamed Job"}</p>
                        <p className="text-xs text-gray-500 mb-2">{job.address}</p>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-3 h-3 text-indigo-500" />
                          <span className="text-[10px] font-bold text-gray-700">{job.foreman || "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase">{job.status}</span>
                        </div>
                     </div>
                   </Popup>
                 </Marker>
               ))}
             </MapContainer>
           )}
           <div className="absolute inset-0 pointer-events-none shadow-[inset_0_30px_30px_rgba(10,10,11,0.5)] z-[400]" />
        </div>

        {/* List View (Bottom Panel) */}
        <div className="h-[30%] min-h-[180px] md:min-h-[280px] bg-[#14151A] border-t border-gray-800 flex flex-col z-[1000] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative">
           <div className="p-5 border-b border-gray-800/50 flex justify-between items-center bg-[#0A0A0B]/80 backdrop-blur-sm">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">Deployment Manifest</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                 <span className="text-[10px] text-indigo-400 font-bold uppercase">{jobs.length} Active Sites</span>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {geocodedJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-900/40 border border-gray-800 hover:border-indigo-500/30 rounded-xl transition-all group">
                   <div className="flex items-center gap-4">
                      <div className={`p-1.5 rounded-lg border ${job.lat ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : (job.geocodingFailed ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-gray-800 border-gray-700 animate-pulse text-gray-500")}`}>
                         {job.geocodingFailed ? <AlertCircle className="w-4 h-4" /> : (job.lat ? <MapPin className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />)}
                      </div>
                      <div>
                         <p className="font-extrabold text-white text-xs group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{job.customerName || "Unnamed Job"}</p>
                         <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{job.address}</p>
                      </div>
                   </div>
                   <div className="hidden md:flex items-center gap-6">
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Execution Team</span>
                         <span className="text-xs font-bold text-gray-300 flex items-center gap-1"><Users className="w-3 h-3 text-indigo-500" /> {job.foreman || "Unassigned"}</span>
                      </div>
                      <div className="h-6 w-[1px] bg-gray-800" />
                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Status</span>
                         <span className="text-xs font-bold text-white shrink-0 bg-gray-800 px-2 py-0.5 rounded">{job.status.replace("_", " ")}</span>
                      </div>
                   </div>
                </div>
              ))}
              {geocodedJobs.length === 0 && (
                 <div className="text-center p-8 text-gray-600 font-medium italic">No jobs selected.</div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
