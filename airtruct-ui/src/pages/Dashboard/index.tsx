import { StatCard } from "../../components/Dashboard/StatCard"; 
import { RecentJob } from "../../components/Dashboard/RecentJob"; 
import { ProcessingOverview } from "../../components/Dashboard/ProcessingOverview"; 

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Extracted Records"
          value="1,452,890"
          percentage="+12.5%"
          description="+12.5% from last week"
          icon="TrendingUp"
        />
        <StatCard
          title="Loaded Data"
          value="1.2 TB"
          percentage="+8.2%"
          description="+8.2% from last week"
          icon="TrendingUp"
        />
        <StatCard
          title="Transformations"
          value="245"
          percentage="+15%"
          description="+15% from last week"
          icon="TrendingUp"
        />
        <StatCard
          title="Active Streams"
          value="18"
          percentage="+3"
          description="+3 since yesterday"
          icon="ArrowUpRight"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <ProcessingOverview />
        <RecentJob />
      </div>
    </div>
  );
};

export default Dashboard;
