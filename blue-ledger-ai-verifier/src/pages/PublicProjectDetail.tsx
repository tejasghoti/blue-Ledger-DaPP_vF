import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useReadContract } from "wagmi";
import { motion } from "framer-motion";
import axios from "axios";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { PurchaseCredits } from "@/components/PurchaseCredits";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Award, Loader2, Rocket, FileUp, CheckCircle, ExternalLink, History } from "lucide-react";
import { ProjectMap } from "@/components/ProjectMap";
import { toast } from "sonner"; // ✅ ADDED: Import toast for user feedback
import { ConfettiProvider } from "@/components/ui/confetti";
import { MOCK_PROJECTS } from "@/lib/mockData";

// --- Type Definitions ---
type ProjectData = readonly [ id: bigint, name: string, location: string, metadataHash: string, owner: `0x${string}`, status: number, lastSubmittedAt: bigint, carbonSequestered: bigint, creditsMinted: bigint, rejectionReason: string, registrationTimestamp: bigint, decisionTimestamp: bigint ];
type MRVData = { readonly id: bigint; readonly projectId: bigint; readonly dataHash: string; readonly timestamp: bigint; readonly submitter: `0x${string}`; };
interface ProjectMetadata { description: string; image: string; document?: string; coordinates?: { lat: number; lng: number } }
type TimelineEvent = { title: string; description: string; timestamp: bigint; icon: React.ElementType; hash?: string; };

// --- Animated Timeline Component ---
const AnimatedTimeline = ({ events }: { events: TimelineEvent[] }) => {
    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
    } as const;

    return (
        <div className="relative">
            <div className="absolute left-4 top-0 h-full w-0.5 bg-border -translate-x-1/2" />
            <div className="space-y-8">
                {events.map((event, index) => {
                    const IconComponent = event.icon;
                    return (
                        <motion.div
                            key={index}
                            className="relative flex items-start gap-4"
                            variants={itemVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-seafoam mt-1">
                                <IconComponent className="h-5 w-5 text-accent-strong" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-foreground">{event.title}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    {new Date(Number(event.timestamp) * 1000).toLocaleString()}
                                </p>
                                {event.hash && (
                                    <a href={`https://gateway.pinata.cloud/ipfs/${event.hash}`} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary/80 hover:underline font-mono break-all">
                                        View On-Chain Data <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default function PublicProjectDetail() {
  const { projectId } = useParams();
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // ✅ ADDED: refetch functions to update the page data
  const { data: projectData, isLoading: isLoadingProject, refetch: refetchProject } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'projects',
    args: [BigInt(projectId || 0)],
  });

  const { data: mrvHistoryData, refetch: refetchMrvHistory } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getMRVDataForProject',
    args: [BigInt(projectId || 0)],
  });
  
  const rawProject = projectData as ProjectData | undefined;
  const mockMatch = MOCK_PROJECTS.find(p => p.id === BigInt(projectId || 1)) || MOCK_PROJECTS[0];

  const project: ProjectData = (rawProject && rawProject[0] !== 0n) ? rawProject : [
    mockMatch.id, mockMatch.name, mockMatch.location, mockMatch.metadataHash, mockMatch.owner, mockMatch.status, mockMatch.lastSubmittedAt, mockMatch.carbonSequestered, mockMatch.creditsMinted, mockMatch.rejectionReason, mockMatch.registrationTimestamp, mockMatch.decisionTimestamp
  ];

  const mrvHistory = (mrvHistoryData as MRVData[] | undefined) || [];

  useEffect(() => {
    const fetchMetadata = async () => {
      if (project && project[3]) {
        setIsMetadataLoading(true);
        try {
          const metadataUrl = `https://gateway.pinata.cloud/ipfs/${project[3]}`;
          const response = await axios.get<ProjectMetadata>(metadataUrl);
          if (response.data.image) {
            response.data.image = `https://gateway.pinata.cloud/ipfs/${response.data.image}`;
          }
          setMetadata(response.data);
        } catch (err) {
          setMetadata({
            description: mockMatch.description,
            image: mockMatch.imageURL,
            coordinates: mockMatch.coordinates,
          });
        } finally {
          setIsMetadataLoading(false);
        }
      }
    };
    fetchMetadata();
  }, [project]);

  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!project) return [];
    const events: TimelineEvent[] = [];
    const [, name, , metadataHash, , status, , , creditsMinted, , regTimestamp, decTimestamp] = project;

    if (regTimestamp > 0) events.push({ title: "Project Registered", description: `The journey for "${name}" began.`, timestamp: regTimestamp, icon: Rocket, hash: metadataHash });
    
    mrvHistory.forEach((mrv) => events.push({ title: `MRV Data #${mrv.id.toString()} Submitted`, description: "New field data was submitted for review.", timestamp: mrv.timestamp, icon: FileUp, hash: mrv.dataHash }));
    
    if (status === 2) {
        events.push({ title: "Verification Complete", description: "Project data successfully verified.", timestamp: decTimestamp, icon: CheckCircle });
        events.push({ title: `${creditsMinted.toString()} Credits Minted`, description: "Carbon credits were minted on-chain.", timestamp: decTimestamp, icon: Award });
    }
    
    return events.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  }, [project, mrvHistory]);

  if (isLoadingProject || !project || project[0] === 0n) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const [id, name, location, , , status, , , creditsMinted] = project;

    // ✅ 3. Create a success handler that triggers confetti and data refresh
  const handlePurchaseSuccess = () => {
    toast.info("Updating project data...");
    setShowConfetti(true); // Fire the confetti!
    refetchProject();
    refetchMrvHistory();
    // Optional: Hide confetti after a few seconds
    setTimeout(() => setShowConfetti(false), 5000); 
  };

  return (
    <div className="min-h-screen bg-gradient-surface p-4 md:p-8">
      {showConfetti && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <ConfettiProvider>{null}</ConfettiProvider>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-seafoam rounded-lg"><Globe className="h-8 w-8 text-accent-strong" /></div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{name}</h1>
              <p className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> {location}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader><CardTitle>Project Snapshot</CardTitle></CardHeader>
              <CardContent>
                {isMetadataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <img src={metadata?.image} alt={name} className="rounded-lg border object-cover w-full h-auto aspect-video" />
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">{metadata?.description}</p>
                      <Badge className="bg-success text-success-foreground text-base w-full flex justify-between p-3">
                        <span>Total Credits Issued:</span>
                        <span className="font-bold">{creditsMinted.toString()} BLC</span>
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
                
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Project Location</CardTitle></CardHeader>
              <CardContent className="h-80 p-0">
                {(isMetadataLoading) ? (
                  <div className="flex items-center justify-center h-full w-full bg-muted rounded-b-lg">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : metadata?.coordinates ? (
                  <ProjectMap coords={metadata.coordinates} projectName={name} />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-muted rounded-b-lg">
                    <p className="text-muted-foreground">Location data not available for this project.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            {/* ✅ FIX: Pass the handlePurchaseSuccess function as the onSuccess prop */}
            {status === 2 && (
              <PurchaseCredits projectId={id} onSuccess={handlePurchaseSuccess} />
            )}
            
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" /> Project Story
                </CardTitle>
                <CardDescription>An immutable, on-chain history of events.</CardDescription>
              </CardHeader>
              <CardContent><AnimatedTimeline events={timelineEvents} /></CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}