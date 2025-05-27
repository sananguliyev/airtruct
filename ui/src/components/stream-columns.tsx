import { Stream } from "@/lib/entities";
import { Badge } from "./ui/badge";
import { useRelativeTime } from "@/lib/utils";
import { 
  componentSchemas as rawComponentSchemas, 
  componentLists 
} from "@/lib/component-schemas";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/toast";

// Helper function to get component display name
const getComponentDisplayName = (componentId: string, type: "input" | "processor" | "output"): string => {
  const typeKey = type === 'processor' ? 'pipeline' : type;
  let schemaCategory: typeof rawComponentSchemas.input | typeof rawComponentSchemas.pipeline | typeof rawComponentSchemas.output | undefined;
  
  if (typeKey === 'input') schemaCategory = rawComponentSchemas.input;
  else if (typeKey === 'pipeline') schemaCategory = rawComponentSchemas.pipeline;
  else if (typeKey === 'output') schemaCategory = rawComponentSchemas.output;

  const rawSchema = schemaCategory?.[componentId as keyof typeof schemaCategory];
  if (rawSchema) {
    return (rawSchema as any).title || componentId;
  }
  return componentId;
};

export const columns = () => [
  { key: "name" as keyof Stream, title: "Name" },
  {
    key: "status" as keyof Stream,
    title: "Status",
    render: (value: string) => {
      const colorMap: Record<string, string> = {
        active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        completed:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        paused:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
      return (
        <Badge className={colorMap[value] || ""} variant="outline">
          {value}
        </Badge>
      );
    },
  },
  {
    key: "input_label" as keyof Stream,
    title: "Input",
    render: (value: string, record: Stream) => {
      const componentDisplay = getComponentDisplayName(record.input_component, "input");
      
      if (record.is_http_server) {
        const ingestPath = `/ingest/${record.parentID}`;
        
        const CopyableIngestPath = () => {
          const { addToast } = useToast();
          
          const handleCopy = async () => {
            try {
              await navigator.clipboard.writeText(ingestPath);
              addToast({
                id: "ingest-path-copied",
                title: "Copied",
                description: "Ingest path copied to clipboard",
                variant: "success",
              });
            } catch (err) {
              console.error('Failed to copy:', err);
            }
          };

          return (
            <code 
              className="bg-muted px-1.5 py-0.5 rounded text-sm cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={handleCopy}
              title="Click to copy"
            >
              {ingestPath}
            </code>
          );
        };

        return (
          <span>
            {value} ({componentDisplay}) - <CopyableIngestPath />
          </span>
        );
      }
      
      return `${value} (${componentDisplay})`;
    },
  },
  {
    key: "processors" as keyof Stream,
    title: "Processors",
    render: (processors: Stream['processors'], record: Stream) => {
      const processorCount = processors?.length || 0;
      
      if (processorCount === 0) {
        return <span className="text-muted-foreground">0</span>;
      }

      const processorList = processors?.map(processor => 
        `${processor.label} (${getComponentDisplayName(processor.component, "processor")})`
      ).join('\n') || '';

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted">
                {processorCount} processors
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="whitespace-pre-line text-sm">
                {processorList}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    key: "output_label" as keyof Stream,
    title: "Output", 
    render: (value: string, record: Stream) => {
      const componentDisplay = getComponentDisplayName(record.output_component, "output");
      return `${value} (${componentDisplay})`;
    },
  },
  {
    key: "createdAt" as keyof Stream,
    title: "Last versioned",
    render: (value: string) => {
      const RelativeTime = () => {
        const time = useRelativeTime(value);
        return <>{time}</>;
      };
      return <RelativeTime />;
    }
  },
];
