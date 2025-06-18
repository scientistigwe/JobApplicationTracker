import React, { useState, useEffect } from "react";
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
} from "lucide-react";

const JobApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [config, setConfig] = useState({
    apiKey: "",
    spreadsheetId: "",
    range: "Applications!A:F",
  });
  const [newApp, setNewApp] = useState({
    company: "",
    position: "",
    date: new Date().toISOString().split("T")[0],
    status: "Applied",
    source: "",
    notes: "",
  });

  const statusOptions = [
    "Applied",
    "Interview Scheduled",
    "Interviewed",
    "Rejected",
    "Offer",
    "Follow-up Needed",
  ];
  const statusColors = {
    Applied: "bg-blue-100 text-blue-800",
    "Interview Scheduled": "bg-yellow-100 text-yellow-800",
    Interviewed: "bg-purple-100 text-purple-800",
    Rejected: "bg-red-100 text-red-800",
    Offer: "bg-green-100 text-green-800",
    "Follow-up Needed": "bg-orange-100 text-orange-800",
  };

  // Load applications from Google Sheets
  const loadFromSheets = async () => {
    if (!config.apiKey || !config.spreadsheetId) {
      setError("Please configure API key and Spreadsheet ID first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}?key=${config.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();

      if (data.values && data.values.length > 1) {
        // Skip header row and convert to objects
        const apps = data.values
          .slice(1)
          .map((row, index) => ({
            id: index + 1,
            company: row[0] || "",
            position: row[1] || "",
            date: row[2] || "",
            status: row[3] || "Applied",
            source: row[4] || "",
            notes: row[5] || "",
          }))
          .filter((app) => app.company); // Filter out empty rows

        setApplications(apps);
      } else {
        setApplications([]);
      }
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save applications to Google Sheets
  const saveToSheets = async (newApplications) => {
    if (!config.apiKey || !config.spreadsheetId) {
      setError("Please configure API key and Spreadsheet ID first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare data with headers
      const values = [
        ["Company", "Position", "Date", "Status", "Source", "Notes"],
        ...newApplications.map((app) => [
          app.company,
          app.position,
          app.date,
          app.status,
          app.source,
          app.notes,
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
        throw new Error(`Failed to save data: ${response.status}`);
      }

      setApplications(newApplications);
    } catch (err) {
      setError(`Error saving data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addApplication = async () => {
    if (newApp.company && newApp.position) {
      const newApplications = [...applications, { ...newApp, id: Date.now() }];
      await saveToSheets(newApplications);
      setNewApp({
        company: "",
        position: "",
        date: new Date().toISOString().split("T")[0],
        status: "Applied",
        source: "",
        notes: "",
      });
    }
  };

  const updateStatus = async (id, newStatus) => {
    const updatedApplications = applications.map((app) =>
      app.id === id ? { ...app, status: newStatus } : app
    );
    await saveToSheets(updatedApplications);
  };

  const deleteApplication = async (id) => {
    const filteredApplications = applications.filter((app) => app.id !== id);
    await saveToSheets(filteredApplications);
  };

  const saveConfig = () => {
    if (config.apiKey && config.spreadsheetId) {
      setIsConfigured(true);
      loadFromSheets();
    }
  };

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

  // Configuration Screen
  if (!isConfigured) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            🚀 Job Application Tracker Setup
          </h1>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="text-blue-400 mr-2" size={20} />
              <div>
                <h3 className="text-lg font-medium text-blue-800">
                  Quick Setup Required
                </h3>
                <p className="text-blue-700 mt-1">
                  Follow the steps below to connect your tracker to Google
                  Sheets for cross-device sync.
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
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) =>
                      setConfig({ ...config, apiKey: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your API key..."
                  />
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

            <button
              onClick={saveConfig}
              disabled={!config.apiKey || !config.spreadsheetId}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              Connect to Google Sheets
            </button>
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
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="text-blue-600" />
              Job Application Challenge
            </h1>
            <p className="text-gray-600 mt-2">
              20 applications per day × 20 days = 400 total applications
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadFromSheets}
              disabled={loading}
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

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
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
              {
                applications.filter((app) => app.status.includes("Interview"))
                  .length
              }
            </div>
            <div className="text-sm text-purple-600">scheduled</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-orange-600" size={20} />
              <span className="text-orange-600 font-medium">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {applications.length > 0
                ? Math.round(
                    (applications.filter((app) => app.status === "Offer")
                      .length /
                      applications.length) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-orange-600">offers</div>
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
            placeholder="Company Name"
            value={newApp.company}
            onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Position Title"
            value={newApp.position}
            onChange={(e) => setNewApp({ ...newApp, position: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={newApp.date}
            onChange={(e) => setNewApp({ ...newApp, date: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            placeholder="Notes"
            value={newApp.notes}
            onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="text-gray-600" />
          All Applications ({applications.length})
        </h2>

        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building size={48} className="mx-auto mb-4 opacity-50" />
            <p>No applications added yet. Start your challenge!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{app.company}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[app.status]
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-1">{app.position}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {app.date}</span>
                      {app.source && <span>📍 {app.source}</span>}
                    </div>
                    {app.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        {app.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      disabled={loading}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteApplication(app.id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1 disabled:text-gray-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationTracker;
