// Mock data for component configs
export interface ComponentConfig {
  id: string
  label: string
  section: string
  component: string
  config: Record<string, any>
  created_at: string
  updated_at: string
  name?: string
  version?: string
  status?: string
  description?: string
  repository?: string
  owner?: string
  dependencies?: string
  lastUpdated?: string
}

export const componentConfigsData: ComponentConfig[] = [
  {
    id: "comp-1",
    label: "User Event Generator",
    section: "input",
    component: "generate",
    config: {
      mapping: 'root = { "user_id": uuid_v4(), "event": "login", "timestamp": now() }',
      interval: "1s",
      count: 0,
      batch_size: 1,
      auto_replay_nacks: true,
    },
    created_at: "2023-10-15T12:00:00Z",
    updated_at: "2023-10-15T12:00:00Z",
    name: "Authentication Service",
    version: "1.2.0",
    status: "Active",
    description: "Handles user authentication and authorization",
    repository: "github.com/org/auth-service",
    owner: "Security Team",
    lastUpdated: "2023-10-15",
  },
  {
    id: "comp-2",
    label: "Payment Processor",
    section: "processor",
    component: "mapping",
    config: {
      mapping: "root = this.payment_data",
    },
    created_at: "2023-11-20T09:30:00Z",
    updated_at: "2023-11-20T09:30:00Z",
    name: "Payment Gateway",
    version: "2.0.1",
    status: "Active",
    description: "Processes payment transactions",
    repository: "github.com/org/payment-gateway",
    owner: "Finance Team",
    dependencies: "Authentication Service",
    lastUpdated: "2023-11-20",
  },
  {
    id: "comp-3",
    label: "Analytics Output",
    section: "output",
    component: "http_client",
    config: {
      url: "https://analytics.example.com/api/events",
      verb: "POST",
      headers: '{ "Content-Type": "application/json", "Authorization": "Bearer ${ENV.API_KEY}" }',
    },
    created_at: "2023-09-05T15:45:00Z",
    updated_at: "2023-09-05T15:45:00Z",
    name: "User Dashboard",
    version: "3.1.0",
    status: "Maintenance",
    description: "User-facing dashboard interface",
    repository: "github.com/org/user-dashboard",
    owner: "UI Team",
    dependencies: "Authentication Service, Analytics Engine",
    lastUpdated: "2023-09-05",
  },
  {
    id: "comp-4",
    label: "Log Splitter",
    section: "processor",
    component: "split",
    config: {
      size: 100,
    },
    created_at: "2023-12-01T10:15:00Z",
    updated_at: "2023-12-01T10:15:00Z",
    name: "Analytics Engine",
    version: "1.0.5",
    status: "Active",
    description: "Processes and analyzes user data",
    repository: "github.com/org/analytics-engine",
    owner: "Data Team",
    lastUpdated: "2023-12-01",
  },
  {
    id: "comp-5",
    label: "Notification Filter",
    section: "processor",
    component: "filter",
    config: {
      condition: "this.priority > 5",
    },
    created_at: "2023-08-10T14:20:00Z",
    updated_at: "2023-08-10T14:20:00Z",
    name: "Notification Service",
    version: "2.3.0",
    status: "Inactive",
    description: "Sends notifications to users",
    repository: "github.com/org/notification-service",
    owner: "Communications Team",
    dependencies: "Authentication Service",
    lastUpdated: "2023-08-10",
  },
]

// Mock data for streams
export interface Stream {
  id: string
  name: string
  status: string
  input: string
  inputLabel?: string
  inputComponentId?: string
  processors?: Array<{
    id: string
    label: string
    component_id: string
  }>
  output: string
  outputLabel?: string
  outputComponentId?: string
  created_at?: string
  updated_at?: string
  source?: string
  destination?: string
  throughput?: string
}

export const streamsData: Stream[] = [
  {
    id: "stream-1",
    name: "User Events Pipeline",
    status: "Active",
    input: "User Event Generator",
    inputLabel: "User Events Source",
    inputComponentId: "comp-1",
    processors: [
      {
        id: "proc-1",
        label: "Payment Processing",
        component_id: "comp-2",
      },
      {
        id: "proc-2",
        label: "Log Splitting",
        component_id: "comp-4",
      },
    ],
    output: "Analytics Output",
    outputLabel: "Analytics Destination",
    outputComponentId: "comp-3",
    created_at: "2023-10-20T08:00:00Z",
    updated_at: "2023-10-20T08:00:00Z",
    source: "Frontend",
    destination: "Analytics",
    throughput: "1.2 MB/s",
  },
  {
    id: "stream-2",
    name: "Payment Processing",
    status: "Active",
    input: "User Event Generator",
    inputLabel: "Payment Events",
    inputComponentId: "comp-1",
    processors: [
      {
        id: "proc-3",
        label: "Payment Filtering",
        component_id: "comp-5",
      },
    ],
    output: "Analytics Output",
    outputLabel: "Payment Database",
    outputComponentId: "comp-3",
    created_at: "2023-11-05T14:30:00Z",
    updated_at: "2023-11-05T14:30:00Z",
    source: "Payment Gateway",
    destination: "Database",
    throughput: "0.5 MB/s",
  },
  {
    id: "stream-3",
    name: "System Logs",
    status: "Active",
    input: "User Event Generator",
    inputLabel: "System Log Collector",
    inputComponentId: "comp-1",
    output: "Analytics Output",
    outputLabel: "Log Storage",
    outputComponentId: "comp-3",
    created_at: "2023-09-10T11:15:00Z",
    updated_at: "2023-09-10T11:15:00Z",
    source: "All Services",
    destination: "Log Storage",
    throughput: "3.7 MB/s",
  },
  {
    id: "stream-4",
    name: "Metrics Collection",
    status: "Paused",
    input: "User Event Generator",
    inputLabel: "Metrics Collector",
    inputComponentId: "comp-1",
    processors: [
      {
        id: "proc-4",
        label: "Metrics Processing",
        component_id: "comp-4",
      },
    ],
    output: "Analytics Output",
    outputLabel: "Dashboard Output",
    outputComponentId: "comp-3",
    created_at: "2023-12-15T09:45:00Z",
    updated_at: "2023-12-15T09:45:00Z",
    source: "Monitoring",
    destination: "Dashboard",
    throughput: "0 MB/s",
  },
]

// Mock data for workers
export interface Worker {
  id: string
  name?: string
  type?: string
  status: string
  lastActive?: string
  lastHeartbeat?: string
  load?: string
  address?: string
  activeStreams?: number
}

export const workersData: Worker[] = [
  {
    id: "worker-1",
    name: "Data Processor",
    type: "Background",
    status: "Running",
    lastActive: "Just now",
    lastHeartbeat: "2023-12-20T15:59:30Z",
    load: "45%",
    address: "worker-1.internal:8080",
    activeStreams: 3,
  },
  {
    id: "worker-2",
    name: "Email Sender",
    type: "Scheduled",
    status: "Running",
    lastActive: "5 min ago",
    lastHeartbeat: "2023-12-20T15:55:12Z",
    load: "12%",
    address: "worker-2.internal:8080",
    activeStreams: 1,
  },
  {
    id: "worker-3",
    name: "Report Generator",
    type: "On-demand",
    status: "Idle",
    lastActive: "1 hour ago",
    lastHeartbeat: "2023-12-20T15:00:45Z",
    load: "0%",
    address: "worker-3.internal:8080",
    activeStreams: 0,
  },
  {
    id: "worker-4",
    name: "Image Processor",
    type: "Background",
    status: "Running",
    lastActive: "Just now",
    lastHeartbeat: "2023-12-20T15:58:22Z",
    load: "78%",
    address: "worker-4.internal:8080",
    activeStreams: 2,
  },
  {
    id: "worker-5",
    name: "Cleanup Service",
    type: "Scheduled",
    status: "Stopped",
    lastActive: "1 day ago",
    lastHeartbeat: "2023-12-19T15:30:10Z",
    load: "0%",
    address: "worker-5.internal:8080",
    activeStreams: 0,
  },
]

