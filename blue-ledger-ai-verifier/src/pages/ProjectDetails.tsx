import { useParams } from "react-router-dom";
import { useAccount, useReadContract } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info, FileText, MapPin, User, CheckCircle, XCircle, Clock, History, ExternalLink, Image as ImageIcon, Award } from "lucide-react";
import { useState, useEffect ,useMemo} from "react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { MRVSubmission } from "@/components/MRVSubmission";
import { ListCredits } from "@/components/ListCredits"; // Correct import path
import { toast } from "sonner"; // Ensure toast is imported if used in this file
import { motion } from "framer-motion";
import { ProjectMap } from "@/components/ProjectMap";
import { MOCK_PROJECTS } from "@/lib/mockData";

// --- TypeScript Interfaces ---
type ProjectData = readonly [
    id: bigint, name: string, location: string, metadataHash: string, owner: `0x${string}`, status: number, lastSubmittedAt: bigint, carbonSequestered: bigint, creditsMinted: bigint, rejectionReason: string, registrationTimestamp: bigint, decisionTimestamp: bigint
];
interface MRVData { id: bigint; projectId: bigint; dataHash: string; timestamp: bigint; submitter: `0x${string}`; }
interface ProjectMetadata { description: string; image: string; coordinates?: { lat: number; lng: number } } // Added coordinates
interface TimelineEvent { title: string; description: string; timestamp: bigint; icon: React.ElementType; hash?: string; }

// --- Helper Data ---
const statusEnum = ["PENDING", "AWAITING_VERIFICATION", "VERIFIED", "REJECTED"] as const;
const statusInfo = {
  PENDING: { label: "Pending Initial Data", icon: Clock, color: "bg-accent text-accent-foreground" },
  AWAITING_VERIFICATION: { label: "Awaiting Review", icon: Clock, color: "bg-warning text-warning-foreground" },
  VERIFIED: { label: "Verified", icon: CheckCircle, color: "bg-success text-success-foreground" },
  REJECTED: { label: "Rejected", icon: XCircle, color: "bg-destructive text-destructive-foreground" },
};

// --- Animated Timeline Component (moved from PublicProjectDetail for reusability if needed, but not included in this file snippet as it was given previously) ---
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

// --- NEW COMPONENT to display the final outcome ---
function VerificationOutcomeCard({ project }: { project: ProjectData }) {
  const status = project[5];
  const creditsMinted = project[8];
  const rejectionReason = project[9];
  const statusKey = status < statusEnum.length ? statusEnum[status] : "PENDING";

  // Don't render anything if the project hasn't been reviewed yet
  if (statusKey !== "VERIFIED" && statusKey !== "REJECTED") {
      return null;
  }

  return (
      <Card className="shadow-card">
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award /> Verification Outcome</CardTitle>
              <CardDescription>The final result from the admin review process.</CardDescription>
          </CardHeader>
          <CardContent>
              {statusKey === "VERIFIED" && (
                  <Alert className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Project Approved!</AlertTitle>
                      <AlertDescription className="mt-2 flex items-center justify-between text-base">
                          <span>Total Carbon Credits Minted:</span>
                          <span className="font-bold text-lg">{creditsMinted.toString()} BLC</span>
                      </AlertDescription>
                  </Alert>
              )}
              {statusKey === "REJECTED" && (
                  <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Project Rejected</AlertTitle>
                      <AlertDescription className="mt-2">
                          <p className="font-semibold mb-1">Admin's Reason:</p>
                          <p className="text-sm">{rejectionReason || "No reason provided."}</p>
                      </AlertDescription>
                  </Alert>
              )}
          </CardContent>
      </Card>
  );
}


export default function ProjectDetails() {
  const { projectId } = useParams();
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);

  const { data: projectData, isLoading: isLoadingProject, isError, refetch: refetchProject } = useReadContract({
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
  
  // Fallback to MOCK_PROJECTS if project doesn't exist on-chain yet
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
          const url = `https://gateway.pinata.cloud/ipfs/${project[3]}`;
          const response = await axios.get<ProjectMetadata>(url);
          if (response.data.image) {
              response.data.image = `https://gateway.pinata.cloud/ipfs/${response.data.image}`;
          }
          setMetadata(response.data);
        } catch (err) {
          // Fallback metadata from MOCK_PROJECTS
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

  // Derive timeline events here if needed, or pass it to a sub-component
  // The AnimatedTimeline component was provided in the previous turn, so assuming it's available.
  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!project) return [];
    const events: TimelineEvent[] = [];
    const [, name, , metadataHash, , status, , , creditsMinted, , regTimestamp, decTimestamp] = project;

    if (regTimestamp > 0) events.push({ title: "Project Registered", description: `The journey for "${name}" began.`, timestamp: regTimestamp, icon: Clock, hash: metadataHash });
    
    mrvHistory.forEach((mrv) => events.push({ title: `MRV Data #${mrv.id.toString()} Submitted`, description: "New field data was submitted for review.", timestamp: mrv.timestamp, icon: FileText, hash: mrv.dataHash }));
    
    if (status === 2) { // Status for VERIFIED
        events.push({ title: "Verification Complete", description: "Project data successfully verified.", timestamp: decTimestamp, icon: CheckCircle });
        events.push({ title: `${creditsMinted.toString()} Credits Minted`, description: "Carbon credits were minted on-chain.", timestamp: decTimestamp, icon: Award });
    }
    
    // Sort events by timestamp to ensure chronological order
    return events.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  }, [project, mrvHistory]); // Dependencies for useMemo

  if (isLoadingProject || isConnecting) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (isError || !project || project[0] === 0n) {
    return <div className="p-8 text-center text-destructive">Error: Could not fetch project details.</div>;
  }
  
  const [id, name, location, metadataHash, owner, status] = project;
  const isOwner = isConnected && !!connectedAddress && !!owner && connectedAddress.toLowerCase() === owner.toLowerCase();
  const statusKey = status < statusEnum.length ? statusEnum[status] : "PENDING";
  const StatusIcon = statusInfo[statusKey].icon;

  const handleSuccess = () => {
    refetchProject(); 
    refetchMrvHistory(); 
  };

  return (
    <div className="min-h-screen bg-gradient-surface p-8">
      <div className="max-w-7xl mx-auto"> {/* Added max-w-7xl for wider layout */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-seafoam rounded-lg"><Info className="h-8 w-8 text-accent-strong" /></div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{name}</h1>
              <p className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> {location}</p>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-semibold">{name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2"><MapPin className="h-4 w-4" /> {location}</CardDescription>
                  </div>
                  <Badge className={cn("text-sm", statusInfo[statusKey].color)}><StatusIcon className="h-4 w-4 mr-2" /> {statusInfo[statusKey].label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold flex items-center gap-2 mb-2"><User className="h-4 w-4" /> NGO Owner</h3>
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded-md">{owner}</p>
              </CardContent>
            </Card>

            <VerificationOutcomeCard project={project} /> {/* Placed here for prominence */}
            
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info /> Project Overview & Baseline</CardTitle>
                <CardDescription>Initial project details and baseline imagery stored on IPFS.</CardDescription>
              </CardHeader>
              <CardContent>
                {isMetadataLoading ? (
                  <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : metadata ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div> <h3 className="font-semibold flex items-center gap-2 mb-2"><FileText className="h-4 w-4" /> Description</h3> <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">{metadata.description}</p> </div>
                      <div> <h3 className="font-semibold flex items-center gap-2 mb-2"><FileText className="h-4 w-4" /> Metadata Hash</h3> <a href={`https://gateway.pinata.cloud/ipfs/${metadataHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline font-mono break-all hover:text-primary/80"> {metadataHash} <ExternalLink className="h-3 w-3" /> </a> </div>
                    </div>
                    <div> 
                      <h3 className="font-semibold flex items-center gap-2 mb-2"><ImageIcon className="h-4 w-4" /> Baseline Image</h3> 
                      {metadata.image ? (
                          <img src={metadata.image} alt="Project Baseline" className="rounded-lg border object-cover w-full h-auto aspect-video" /> 
                      ) : (
                          <div className="flex items-center justify-center h-48 w-full bg-muted rounded-lg text-muted-foreground">No image available</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Could not load project metadata from IPFS.</p>
                )}
              </CardContent>
            </Card>
          
            {metadata?.coordinates && (
                <Card className="shadow-card">
                    <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Project Location</CardTitle></CardHeader>
                    <CardContent className="h-80 p-0">
                        <ProjectMap coords={metadata.coordinates} projectName={name} />
                    </CardContent>
                </Card>
            )}
            
          </div>
          
          {/* Right Column (1/3 width on large screens) */}
          <div className="lg:col-span-1 space-y-6">
            {isOwner && (statusKey === "PENDING" || statusKey === "AWAITING_VERIFICATION" || statusKey === "VERIFIED") && (
                <MRVSubmission projectId={id.toString()} isOwner={isOwner} onSuccess={handleSuccess} />
            )}
            {isOwner && statusKey === "VERIFIED" && (
                <ListCredits project={project} onSuccess={handleSuccess} />
            )}

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><History /> MRV Submission History</CardTitle>
                <CardDescription>A complete, on-chain log of all data submitted for this project.</CardDescription>
              </CardHeader>
              <CardContent>
                {mrvHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    <Info className="mx-auto h-6 w-6 mb-2" />
                    No MRV data has been submitted for this project yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mrvHistory.map((mrv: MRVData,index) => ( 
                      <div key={mrv.dataHash} className="p-3 bg-muted/50 rounded-lg border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold">Submission #{index + 1}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(Number(mrv.timestamp) * 1000).toLocaleString()}
                          </span>
                        </div>
                        <a href={`https://gateway.pinata.cloud/ipfs/${mrv.dataHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary underline font-mono break-all hover:text-primary/80">
                           {mrv.dataHash} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

             <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" /> Project Timeline
                </CardTitle>
                <CardDescription>Key milestones in the project's lifecycle.</CardDescription>
              </CardHeader>
              <CardContent><AnimatedTimeline events={timelineEvents} /></CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}