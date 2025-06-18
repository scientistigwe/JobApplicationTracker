import { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Building,
  RefreshCw,
  AlertCircle,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  X,
  Edit,
  Save,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

interface Application {
  id: number;
  company: string;
  position: string;
  date: string;
  status: string;
  source: string;
  notes: string;
  salary: string;
}

const JobApplicationTracker = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPassword, setShowPassword] = useState(false);

  const [config, setConfig] = useState({
    apiKey: "",
    spreadsheetId: "",
    range: "Applications!A:G",
  });

  const [newApp, setNewApp] = useState<Omit<Application, "id">>({
    company: "",
    position: "",
    date: new Date().toISOString().split("T")[0],
    status: "Applied",
    source: "",
    notes: "",
    salary: "",
  });

  const statusOptions = [
    "Applied",
    "Application Viewed",
    "Phone Screen",
    "Interview Scheduled",
    "Technical Interview",
    "Final Interview",
    "Offer Received",
    "Offer Accepted",
    "Rejected",
    "Withdrawn",
    "Follow-up Needed",
    "Waiting Response",
  ];

  const statusColors: { [key: string]: string } = {
    Applied: "bg-blue-100 text-blue-800 border-blue-200",
    "Application Viewed": "bg-cyan-100 text-cyan-800 border-cyan-200",
    "Phone Screen": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Interview Scheduled": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Technical Interview": "bg-purple-100 text-purple-800 border-purple-200",
    "Final Interview": "bg-pink-100 text-pink-800 border-pink-200",
    "Offer Received": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Offer Accepted": "bg-green-100 text-green-800 border-green-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
    Withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
    "Follow-up Needed": "bg-orange-100 text-orange-800 border-orange-200",
    "Waiting Response": "bg-amber-100 text-amber-800 border-amber-200",
  };

  // Load from memory on component mount
  useEffect(() => {
    const savedConfig = JSON.parse(
      sessionStorage.getItem("jobTrackerConfig") || "{}"
    );
    const savedApps = JSON.parse(
      sessionStorage.getItem("jobTrackerApps") || "[]"
    );

    if (savedConfig.apiKey && savedConfig.spreadsheetId) {
      setConfig(savedConfig);
      setIsConfigured(true);
    }

    if (savedApps.length > 0) {
      setApplications(savedApps);
      setFilteredApplications(savedApps);
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Filter applications based on search and status
  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  // Auto-clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Validation
  const validateApplication = (app: Omit<Application, "id">) => {
    const errors = [];
    if (!app.company?.trim()) errors.push("Company name is required");
    if (!app.position?.trim()) errors.push("Position is required");
    if (!app.date) errors.push("Date is required");
    return errors;
  };

  // Save to memory
  const saveToMemory = (apps: Application[]) => {
    sessionStorage.setItem("jobTrackerApps", JSON.stringify(apps));
    setApplications(apps);
  };

  // Load applications from Google Sheets
  const loadFromSheets = async () => {
    if (!config.apiKey || !config.spreadsheetId) {
      setError("Please configure API key and Spreadsheet ID first");
      return;
    }

    if (!isOnline) {
      setError("You're offline. Using cached data.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}?key=${config.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("API key invalid or quota exceeded");
        } else if (response.status === 404) {
          throw new Error("Spreadsheet not found or not publicly accessible");
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.values && data.values.length > 1) {
        const apps: Application[] = data.values
          .slice(1)
          .map((row: any[], index: number) => ({
            id: Date.now() + index,
            company: row[0] || "",
            position: row[1] || "",
            date: row[2] || "",
            status: row[3] || "Applied",
            source: row[4] || "",
            notes: row[5] || "",
            salary: row[6] || "",
          }))
          .filter((app: Application) => app.company?.trim());

        saveToMemory(apps);
        setSuccess("Data synced successfully!");
      } else {
        saveToMemory([]);
      }
    } catch (err: any) {
      setError(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save applications to Google Sheets
  const saveToSheets = async (newApplications: Application[]) => {
    if (!config.apiKey || !config.spreadsheetId) {
      setError("Please configure API key and Spreadsheet ID first");
      return false;
    }

    if (!isOnline) {
      setError(
        "You're offline. Changes saved locally and will sync when online."
      );
      saveToMemory(newApplications);
      return true;
    }

    setLoading(true);
    setError("");

    try {
      const values = [
        ["Company", "Position", "Date", "Status", "Source", "Notes", "Salary"],
        ...newApplications.map((app) => [
          app.company,
          app.position,
          app.date,
          app.status,
          app.source,
          app.notes,
          app.salary || "",
        ]),
      ];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}?valueInputOption=RAW&key=${config.apiKey}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: HTTP ${response.status}`);
      }

      saveToMemory(newApplications);
      setSuccess("Changes saved and synced!");
      return true;
    } catch (err: any) {
      setError(`Save failed: ${err.message}. Changes saved locally.`);
      saveToMemory(newApplications);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addApplication = async () => {
    const errors = validateApplication(newApp);
    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }

    const newApplications = [...applications, { ...newApp, id: Date.now() }];
    const success = await saveToSheets(newApplications);

    if (success || !isOnline) {
      setNewApp({
        company: "",
        position: "",
        date: new Date().toISOString().split("T")[0],
        status: "Applied",
        source: "",
        notes: "",
        salary: "",
      });
    }
  };

  const updateApplication = async (
    id: number,
    updates: Partial<Application>
  ) => {
    const updatedApplications = applications.map((app) =>
      app.id === id ? { ...app, ...updates } : app
    );
    await saveToSheets(updatedApplications);
    setEditingId(null);
  };

  const deleteApplication = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      const filteredApplications = applications.filter((app) => app.id !== id);
      await saveToSheets(filteredApplications);
    }
  };

  const saveConfig = () => {
    if (config.apiKey && config.spreadsheetId) {
      sessionStorage.setItem("jobTrackerConfig", JSON.stringify(config));
      setIsConfigured(true);
      setShowConfig(false);
      loadFromSheets();
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(applications, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-applications-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target && typeof e.target.result === "string") {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
              const processedData = importedData.map((app, index) => ({
                ...app,
                id: Date.now() + index,
              }));
              saveToMemory(processedData);
              setSuccess("Data imported successfully!");
            } else {
              setError("Invalid file format");
            }
          }
        } catch (err) {
          setError("Failed to import data: Invalid JSON");
        }
      };
      reader.readAsText(file);
    }
  };

  // Statistics
  const getTotalApplications = () => applications.length;
  const getDailyAverage = () => {
    if (applications.length === 0) return 0;
    const uniqueDates = [...new Set(applications.map((app) => app.date))];
    return (applications.length / uniqueDates.length).toFixed(1);
  };

  const getApplicationsToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return applications.filter((app) => app.date === today).length;
  };

  const getProgressPercentage = () => {
    return Math.min((getTotalApplications() / 400) * 100, 100);
  };

  const getInterviewCount = () => {
    return applications.filter(
      (app) =>
        app.status.toLowerCase().includes("interview") ||
        app.status === "Phone Screen"
    ).length;
  };

  const getOfferCount = () => {
    return applications.filter(
      (app) =>
        app.status === "Offer Received" || app.status === "Offer Accepted"
    ).length;
  };

  const getSuccessRate = () => {
    if (applications.length === 0) return 0;
    return Math.round((getOfferCount() / applications.length) * 100);
  };

  // Configuration Screen
  if (!isConfigured || showConfig) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🚀 Job Application Tracker Setup
            </h1>
            {isConfigured && (
              <button
                onClick={() => setShowConfig(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            )}
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="text-blue-400 mr-2" size={20} />
              <div>
                <h3 className="text-lg font-medium text-blue-800">
                  Optional Google Sheets Integration
                </h3>
                <p className="text-blue-700 mt-1">
                  Connect to Google Sheets for cross-device sync. Works offline
                  without setup.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Step 1: Create Google Sheets API Key
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.developers.google.com"
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Create a new project or select existing one</li>
                <li>Enable "Google Sheets API"</li>
                <li>Go to "Credentials" → "Create Credentials" → "API Key"</li>
                <li>Copy your API key</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Step 2: Create Your Spreadsheet
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  Create a new{" "}
                  <a
                    href="https://sheets.google.com"
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener"
                  >
                    Google Sheet
                  </a>
                </li>
                <li>Name the first sheet "Applications"</li>
                <li>
                  Make it publicly readable: Share → "Anyone with the link can
                  view"
                </li>
                <li>
                  Copy the Spreadsheet ID from the URL (between /d/ and /edit)
                </li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                Step 3: Enter Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Sheets API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) =>
                        setConfig({ ...config, apiKey: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your API key..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={config.spreadsheetId}
                    onChange={(e) =>
                      setConfig({ ...config, spreadsheetId: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Found in your sheet URL: docs.google.com/spreadsheets/d/
                    <strong>SPREADSHEET_ID</strong>/edit
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveConfig}
                disabled={!config.apiKey || !config.spreadsheetId}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Connect to Google Sheets
              </button>

              {isConfigured && (
                <button
                  onClick={() => {
                    setShowConfig(false);
                    setIsConfigured(true);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Use Offline Mode
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Application Interface
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="text-blue-600" />
              Job Application Challenge
            </h1>
            <p className="text-gray-600 mt-2">
              Track your job search progress - Aiming for 400 total applications
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="text-green-500" size={16} />
              ) : (
                <WifiOff className="text-red-500" size={16} />
              )}
              <span className="text-sm text-gray-600">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            <button
              onClick={() => setShowConfig(true)}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Settings"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={loadFromSheets}
              disabled={loading || !isOnline}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
              {loading ? "Syncing..." : "Sync"}
            </button>

            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {getTotalApplications()}/400
              </div>
              <div className="text-sm text-gray-500">Total Applications</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-green-800 text-sm">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="text-green-600 hover:text-green-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Challenge Progress</span>
            <span>{getProgressPercentage().toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              <span className="text-blue-600 font-medium">Today</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {getApplicationsToday()}
            </div>
            <div className="text-sm text-blue-600">applications</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="text-green-600 font-medium">Daily Avg</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {getDailyAverage()}
            </div>
            <div className="text-sm text-green-600">per day</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="text-purple-600" size={20} />
              <span className="text-purple-600 font-medium">Interviews</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {getInterviewCount()}
            </div>
            <div className="text-sm text-purple-600">scheduled</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-orange-600" size={20} />
              <span className="text-orange-600 font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {getSuccessRate()}%
            </div>
            <div className="text-sm text-orange-600">
              {getOfferCount()} offers
            </div>
          </div>
        </div>
      </div>

      {/* Add New Application */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="text-green-600" />
          Add New Application
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Company Name *"
            value={newApp.company}
            onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            placeholder="Position Title *"
            value={newApp.position}
            onChange={(e) => setNewApp({ ...newApp, position: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="date"
            value={newApp.date}
            onChange={(e) => setNewApp({ ...newApp, date: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <select
            value={newApp.status}
            onChange={(e) => setNewApp({ ...newApp, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Source (LinkedIn, Indeed, etc.)"
            value={newApp.source}
            onChange={(e) => setNewApp({ ...newApp, source: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Expected Salary"
            value={newApp.salary}
            onChange={(e) => setNewApp({ ...newApp, salary: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <textarea
            placeholder="Notes"
            value={newApp.notes}
            onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={addApplication}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          {loading ? "Adding..." : "Add Application"}
        </button>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="text-gray-600" />
            All Applications ({filteredApplications.length})
          </h2>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="All">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Export Data"
              >
                <Download size={16} />
              </button>

              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building size={48} className="mx-auto mb-4 opacity-50" />
            <p>
              {applications.length === 0
                ? "No applications added yet. Start your challenge!"
                : "No applications match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {editingId === app.id ? (
                  <EditApplicationForm
                    app={app}
                    onSave={(updates: Partial<Application>) =>
                      updateApplication(app.id, updates)
                    }
                    onCancel={() => setEditingId(null)}
                    statusOptions={statusOptions}
                  />
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{app.company}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            statusColors[app.status]
                          }`}
                        >
                          {app.status}
                        </span>
                        {app.salary && (
                          <span className="text-sm text-green-600 font-medium">
                            💰 {app.salary}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-1 font-medium">
                        {app.position}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>📅 {app.date}</span>
                        {app.source && <span>📍 {app.source}</span>}
                      </div>
                      {app.notes && (
                        <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                          {app.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          updateApplication(app.id, { status: e.target.value })
                        }
                        disabled={loading}
                        className={`text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 ${
                          statusColors[app.status]
                        }`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => setEditingId(app.id)}
                        disabled={loading}
                        className="p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-400"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => deleteApplication(app.id)}
                        disabled={loading}
                        className="p-1 text-red-500 hover:text-red-700 disabled:text-gray-400"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface EditApplicationFormProps {
  app: Application;
  onSave: (updates: Partial<Application>) => void;
  onCancel: () => void;
  statusOptions: string[];
}

const EditApplicationForm: React.FC<EditApplicationFormProps> = ({
  app,
  onSave,
  onCancel,
  statusOptions,
}) => {
  const [editedApp, setEditedApp] = useState(app);

  const handleSave = () => {
    onSave(editedApp);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          value={editedApp.company}
          onChange={(e) =>
            setEditedApp({ ...editedApp, company: e.target.value })
          }
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          value={editedApp.position}
          onChange={(e) =>
            setEditedApp({ ...editedApp, position: e.target.value })
          }
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="date"
          value={editedApp.date}
          onChange={(e) => setEditedApp({ ...editedApp, date: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <select
          value={editedApp.status}
          onChange={(e) =>
            setEditedApp({ ...editedApp, status: e.target.value })
          }
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={editedApp.source}
          onChange={(e) =>
            setEditedApp({ ...editedApp, source: e.target.value })
          }
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          value={editedApp.salary}
          onChange={(e) =>
            setEditedApp({ ...editedApp, salary: e.target.value })
          }
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>
      <textarea
        value={editedApp.notes}
        onChange={(e) => setEditedApp({ ...editedApp, notes: e.target.value })}
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-3 py-1 rounded-lg"
        >
          <Save size={16} />
        </button>
        <button onClick={onCancel} className="bg-gray-200 px-3 py-1 rounded-lg">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default JobApplicationTracker;
