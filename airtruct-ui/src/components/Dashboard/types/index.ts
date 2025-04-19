export interface StatCardProps {
    title: string;
    value: string;
    percentage: string;
    description: string;
    icon: "TrendingUp" | "ArrowUpRight"; 
  }
  
  export interface Job {
    icon: JSX.Element;
    name: string;
    source: string;
    status: string;
    records: string;
  }
  