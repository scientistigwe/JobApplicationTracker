import { useState, useEffect } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Edit,
  Save,
  Delete,
  Refresh,
  Settings,
  GetApp,
  Publish,
  Search,
  Close,
  Visibility,
  VisibilityOff,
  Wifi,
  WifiOff,
} from "@mui/icons-material";
import { GoogleAuthButton } from "./GoogleAuth";

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
  const [showConfig, setShowConfig] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPassword, setShowPassword] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Remove apiKey from config, use only spreadsheetId and range
  const [config, setConfig] = useState({
    spreadsheetId: "",
    range: "Applications!A:H",
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

  const statusColors: { [key: string]: any } = {
    Applied: "primary",
    "Application Viewed": "info",
    "Phone Screen": "secondary",
    "Interview Scheduled": "warning",
    "Technical Interview": "secondary",
    "Final Interview": "secondary",
    "Offer Received": "success",
    "Offer Accepted": "success",
    Rejected: "error",
    Withdrawn: "default",
    "Follow-up Needed": "warning",
    "Waiting Response": "info",
  };

  // Load from memory on component mount
  useEffect(() => {
    const savedConfig = JSON.parse(
      localStorage.getItem("jobTrackerConfig") || "{}"
    );
    const savedApps = JSON.parse(
      localStorage.getItem("jobTrackerApps") || "[]"
    );

    if (savedConfig.spreadsheetId) {
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
    localStorage.setItem("jobTrackerApps", JSON.stringify(apps));
    setApplications(apps);
  };

  const syncWithSheets = async () => {
    if (!isOnline) {
      setError("You must be online to sync with Google Sheets.");
      return;
    }
    await saveToSheets(applications);
    await loadFromSheets();
  };

  // Load applications from Google Sheets
  const loadFromSheets = async () => {
    if (!googleToken || !config.spreadsheetId) {
      setError("Please sign in and configure Spreadsheet ID first");
      return;
    }
    if (!isOnline) {
      setError("You're offline. Using cached data.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${googleToken}` },
      });

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
    if (!googleToken || !config.spreadsheetId) {
      setError("Please sign in and configure Spreadsheet ID first");
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
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}?valueInputOption=RAW`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${googleToken}`,
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

  // Add a new application
  const addApplication = () => {
    const validationErrors = validateApplication(newApp);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      return;
    }

    const newApplication: Application = {
      id: Date.now(),
      ...newApp,
    };

    const newApplications = [...applications, newApplication];
    saveToMemory(newApplications);

    setNewApp({
      company: "",
      position: "",
      date: new Date().toISOString().split("T")[0],
      status: "Applied",
      source: "",
      notes: "",
      salary: "",
    });
  };

  // Update an application
  const updateApplication = (appToUpdate: Application) => {
    const updatedApps = applications.map((app) =>
      app.id === appToUpdate.id ? appToUpdate : app
    );
    saveToMemory(updatedApps);
    setEditingId(null);
  };

  // Delete an application
  const deleteApplication = (id: number) => {
    const newApplications = applications.filter((app) => app.id !== id);
    saveToMemory(newApplications);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewApp({ ...newApp, [name]: value });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setNewApp({ ...newApp, [name]: value });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: number
  ) => {
    const { name, value } = e.target;
    const updatedApps = filteredApplications.map((app) =>
      app.id === id ? { ...app, [name]: value } : app
    );
    setFilteredApplications(updatedApps);
  };

  const handleEditSelectChange = (e: any, id: number) => {
    const { name, value } = e.target;
    const updatedApps = filteredApplications.map((app) =>
      app.id === id ? { ...app, [name]: value } : app
    );
    setFilteredApplications(updatedApps);
  };

  // Save configuration
  const saveConfig = () => {
    if (config.spreadsheetId) {
      localStorage.setItem("jobTrackerConfig", JSON.stringify(config));
      setIsConfigured(true);
      setShowConfig(false);
      setSuccess("Configuration saved!");
      loadFromSheets();
    } else {
      setError("Please provide Spreadsheet ID");
    }
  };

  // Export to JSON
  const exportToJson = () => {
    const dataStr = JSON.stringify(applications, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;
    const exportFileDefaultName = "job_applications.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Import from JSON
  const importFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const importedApps = JSON.parse(e.target?.result as string);
          if (
            Array.isArray(importedApps) &&
            importedApps.every((app) => app.company && app.position)
          ) {
            saveToMemory(importedApps);
            setSuccess("Data imported successfully!");
          } else {
            setError("Invalid JSON file format.");
          }
        } catch (error) {
          setError("Error parsing JSON file.");
        }
      };
    }
  };

  const renderApplicationRow = (app: Application) => {
    const isEditing = editingId === app.id;
    return (
      <TableRow
        key={app.id}
        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
      >
        <TableCell component="th" scope="row">
          {isEditing ? (
            <TextField
              size="small"
              name="company"
              value={app.company}
              onChange={(e) => handleEditChange(e, app.id)}
            />
          ) : (
            app.company
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              name="position"
              value={app.position}
              onChange={(e) => handleEditChange(e, app.id)}
            />
          ) : (
            app.position
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              type="date"
              name="date"
              value={app.date}
              onChange={(e) => handleEditChange(e, app.id)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          ) : (
            app.date
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <FormControl fullWidth size="small">
              <Select
                name="status"
                value={app.status}
                onChange={(e) => handleEditSelectChange(e, app.id)}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Chip
              label={app.status}
              color={statusColors[app.status] || "default"}
              size="small"
            />
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              name="source"
              value={app.source}
              onChange={(e) => handleEditChange(e, app.id)}
            />
          ) : (
            app.source
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              name="salary"
              value={app.salary}
              onChange={(e) => handleEditChange(e, app.id)}
            />
          ) : (
            app.salary
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              name="notes"
              value={app.notes}
              onChange={(e) => handleEditChange(e, app.id)}
              multiline
              maxRows={2}
            />
          ) : (
            app.notes
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <>
              <IconButton onClick={() => updateApplication(app)} size="small">
                <Save />
              </IconButton>
              <IconButton onClick={() => setEditingId(null)} size="small">
                <Close />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton onClick={() => setEditingId(app.id)} size="small">
                <Edit />
              </IconButton>
              <IconButton
                onClick={() => deleteApplication(app.id)}
                size="small"
              >
                <Delete />
              </IconButton>
            </>
          )}
        </TableCell>
      </TableRow>
    );
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Job Application Tracker
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please sign in with Google to connect to your Google Sheet. Your
            login is secure and never stored.
          </Typography>
          <GoogleAuthButton
            onSuccess={(token) => {
              setGoogleToken(token);
              setIsLoggedIn(true);
            }}
          />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" component="h1">
            Job Application Tracker
          </Typography>
          <Box>
            <Chip
              icon={isOnline ? <Wifi /> : <WifiOff />}
              label={isOnline ? "Online" : "Offline"}
              color={isOnline ? "success" : "error"}
              variant="outlined"
              sx={{ mr: 2 }}
            />
            <IconButton onClick={() => setShowConfig(!showConfig)}>
              <Settings />
            </IconButton>
          </Box>
        </Box>

        {showConfig && (
          <Box sx={{ mb: 3, p: 2, border: "1px solid grey", borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Spreadsheet ID"
                  value={config.spreadsheetId}
                  onChange={(e) =>
                    setConfig({ ...config, spreadsheetId: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sheet Range"
                  value={config.range}
                  onChange={(e) =>
                    setConfig({ ...config, range: e.target.value })
                  }
                />
              </Grid>
            </Grid>
            <Button onClick={saveConfig} variant="contained" sx={{ mt: 2 }}>
              Save Configuration
            </Button>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New Application
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={newApp.company}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Position"
                name="position"
                value={newApp.position}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                name="date"
                value={newApp.date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={newApp.status}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Source"
                name="source"
                value={newApp.source}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Salary"
                name="salary"
                value={newApp.salary}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={newApp.notes}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                onClick={addApplication}
                variant="contained"
                startIcon={<Add />}
                disabled={loading}
              >
                Add Application
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={loadFromSheets}
              variant="outlined"
              startIcon={<Refresh />}
              disabled={loading || !isConfigured}
            >
              Refresh from Sheets
            </Button>
            <Button
              component="label"
              variant="outlined"
              startIcon={<Publish />}
            >
              Import JSON
              <input
                type="file"
                accept=".json"
                hidden
                onChange={importFromJson}
              />
            </Button>
            <Button
              onClick={exportToJson}
              variant="outlined"
              startIcon={<GetApp />}
            >
              Export to JSON
            </Button>
          </Box>
          {loading && <CircularProgress size={24} />}
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Current Applications
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Date Applied</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((app) => {
                const isEditing = editingId === app.id;
                return (
                  <TableRow
                    key={app.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {isEditing ? (
                        <TextField
                          size="small"
                          name="company"
                          value={app.company}
                          onChange={(e) => handleEditChange(e, app.id)}
                        />
                      ) : (
                        app.company
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          name="position"
                          value={app.position}
                          onChange={(e) => handleEditChange(e, app.id)}
                        />
                      ) : (
                        app.position
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="date"
                          name="date"
                          value={app.date}
                          onChange={(e) => handleEditChange(e, app.id)}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      ) : (
                        app.date
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <FormControl fullWidth size="small">
                          <Select
                            name="status"
                            value={app.status}
                            onChange={(e) => handleEditSelectChange(e, app.id)}
                          >
                            {statusOptions.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={app.status}
                          color={statusColors[app.status] || "default"}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          name="source"
                          value={app.source}
                          onChange={(e) => handleEditChange(e, app.id)}
                        />
                      ) : (
                        app.source
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          name="salary"
                          value={app.salary}
                          onChange={(e) => handleEditChange(e, app.id)}
                        />
                      ) : (
                        app.salary
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          name="notes"
                          value={app.notes}
                          onChange={(e) => handleEditChange(e, app.id)}
                          multiline
                          rows={2}
                        />
                      ) : (
                        app.notes
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <>
                          <IconButton
                            onClick={() => updateApplication(app)}
                            size="small"
                          >
                            <Save />
                          </IconButton>
                          <IconButton
                            onClick={() => setEditingId(null)}
                            size="small"
                          >
                            <Close />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => setEditingId(app.id)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => deleteApplication(app.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredApplications.length === 0 && !loading && (
          <Typography sx={{ mt: 2, textAlign: "center" }}>
            No applications found.
          </Typography>
        )}
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError("")}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccess("")}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default JobApplicationTracker;
