import { useState, useMemo, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { PublicProjectCard } from '@/components/PublicProjectCard';
import { motion } from 'framer-motion';
import { WorldMap } from '@/components/ui/WorldMap';
import axios from 'axios';
import { LoaderThree } from '@/components/ui/loader'; 
import { MOCK_PROJECTS } from "@/lib/mockData";
// Define the core Project interface as it comes from the contract
// This interface MUST include all properties that PublicProjectCard expects.
interface Project {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  creditsMinted: bigint; 
  status: number; // <--- ADDED THIS PROPERTY (CRITICAL FOR FILTERING)
  // Add other Project fields as they exist in your contract if PublicProjectCard
  // or other parts of your app might use them. E.g.:
  // owner: `0x${string}`;
  // lastSubmittedAt: bigint;
  // carbonSequestered: bigint;
  // rejectionReason: string;
  // registrationTimestamp: bigint;
  // decisionTimestamp: bigint;
}

// Type for project enriched with coordinates after fetching metadata
type ProjectWithCoords = Project & {
  coordinates: { lat: number; lng: number } | null;
};

export function PublicRegistry() {
  const [allProjectsWithCoords, setAllProjectsWithCoords] = useState<ProjectWithCoords[]>([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);

  const { data: allProjectsRaw, isLoading: isContractLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getAllProjects',
    query: { refetchInterval: 10000 }, // Keep projects updated
  });

  useEffect(() => {
    const fetchAllMetadata = async () => {
      setIsMetadataLoading(true);
      if (!allProjectsRaw) {
        setAllProjectsWithCoords([]);
        setIsMetadataLoading(false);
        return;
      }

      // Ensure `allProjectsRaw` is correctly typed when mapping.
      const projects = Array.from(allProjectsRaw as unknown as Project[]); 
      
      const enrichedProjectsPromises = projects.map(async (project) => {
        try {
          const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${project.metadataHash}`);
          if (response.data && typeof response.data.coordinates === 'object' && response.data.coordinates.lat !== undefined && response.data.coordinates.lng !== undefined) {
            return { ...project, coordinates: response.data.coordinates };
          }
          console.warn(`Metadata for project ${project.id} is missing valid coordinates.`, response.data);
          return { ...project, coordinates: null };
        } catch (e) {
          console.error(`Failed to fetch metadata for project ${project.id} (hash: ${project.metadataHash}):`, e);
          return { ...project, coordinates: null };
        }
      });

      const enrichedProjects = await Promise.all(enrichedProjectsPromises);
      // Filter out projects for which coordinates could not be fetched
      setAllProjectsWithCoords(enrichedProjects.filter(p => p.coordinates !== null));
      setIsMetadataLoading(false);
    };

    if (!isContractLoading) {
      fetchAllMetadata();
    }
  }, [allProjectsRaw, isContractLoading]);

  const isLoading = isContractLoading || isMetadataLoading;

  // Filter projects to show verified ones (status === 2), fallback to MOCK_PROJECTS for demo
  const verifiedProjectsWithCoords = useMemo(() => {
    const verified = allProjectsWithCoords.filter(p => p.status === 2);
    if (verified.length > 0) return verified;
    return MOCK_PROJECTS.filter(p => p.status === 2) as unknown as ProjectWithCoords[];
  }, [allProjectsWithCoords]);

  // Prepare pins for the WorldMap component from only verified projects
  const mapPins = useMemo(() => {
    return verifiedProjectsWithCoords.map(p => ({
      lat: p.coordinates!.lat,
      lng: p.coordinates!.lng,
    }));
  }, [verifiedProjectsWithCoords]);
  
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Public Project Registry</h1>
        <p className="text-muted-foreground mt-2">Explore verified blue carbon projects from around the world.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <LoaderThree/>
          <p className="ml-4 text-muted-foreground">Loading projects and their data...</p>
        </div>
      )}
      
      {!isLoading && verifiedProjectsWithCoords.length === 0 && ( // ✅ Check verifiedProjectsWithCoords
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
          <Info className="mx-auto h-8 w-8 mb-4" />
          <h2 className="text-xl font-semibold">No Verified Projects Found</h2> {/* ✅ Updated Text */}
          <p>There are no verified projects in the registry yet. Check back later!</p> {/* ✅ Updated Text */}
        </div>
      )}

      {/* Project Cards Grid - Only render if not loading and verified projects exist */}
      {!isLoading && verifiedProjectsWithCoords.length > 0 && ( // ✅ Check verifiedProjectsWithCoords
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          initial="hidden"
          animate="visible"
        >
          {verifiedProjectsWithCoords.map(project => ( // ✅ Map over verifiedProjectsWithCoords
            <PublicProjectCard key={project.id.toString()} project={project} />
          ))}
        </motion.div>
      )}

      {/* WorldMap component moved to the end of the page - Only render if not loading and verified projects exist */}
      {!isLoading && verifiedProjectsWithCoords.length > 0 && ( // ✅ Check verifiedProjectsWithCoords
        <motion.div 
          className="mt-8 mb-4 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4">Our Global Impact (Verified Projects)</h2> {/* ✅ Updated Text */}
          <p className="text-muted-foreground text-center mb-8 max-w-2xl">
            Visually track the worldwide reach of *verified* projects registered on the Blue Ledger, bringing transparency to global carbon sequestration efforts.
          </p>
          <WorldMap pins={mapPins} pinColor="#22c55e" />
        </motion.div>
      )}
    </div>
  );
}